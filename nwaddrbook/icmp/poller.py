import os
import socket
import collections

from .protocol import PacketBuilder
from .protocol import Sequence
from ..sched import TimeoutScheduler


class TargetsList:
    "Список основных целей для опроса"

    STATUS_UNKNOWN = 1
    STATUS_ALIVE = 2
    STATUS_UNREACHABLE = 3

    def __init__(self, period=3.0, store_metrics=5, unreachable_threshold=3):
        self._targets = []
        self._iterators = []
        self._next_idx = 0
        self._poll_period = period
        self._poller = None
        self._timer_handle = None
        self._sender_id = None
        self._next_req_time = 0

        self._store_metrics = store_metrics
        self._unreachable_threshold = unreachable_threshold
        self._metrics = {}
        self._statuses = {}

        self._set_all = set()
        self._set_alive = set()

        self._cb_status_change = None

    def on_status_change(self, callback):
        self._cb_status_change = callback

    def register_poller(self, sender_id, poller):
        self._poller = poller
        self._sender_id = sender_id

    def put_request(self, target):
        task_data = (self._sender_id, target)
        self._poller.req_queue.append(task_data)

    def handle_enqueue_next(self):
        if self.len() > 0:
            next_target = self.next()
            self.put_request(next_target)

            delay = self._poll_period / self.len()
            delay = min(delay, 1.0)  # Не реже раза в секунду проводить проверку
        else:
            delay = 1.0
        self._next_req_time = self._poller.loop.time() + delay
        self._timer_handle = self._poller.loop.call_at(self._next_req_time, self.handle_enqueue_next)

    def handle_reply(self, target, roundtrip_time):
        self.put_metric(target, roundtrip_time)

        status, count = self.metrics_to_status(target)
        self.handle_status_change(target, status)

    def handle_timeout(self, target):
        self.put_metric(target, None)

        status, count = self.metrics_to_status(target)

        if count < min(self._unreachable_threshold, self._store_metrics):
            self.put_request(target)
        else:
            self.handle_status_change(target, status)

    def handle_status_change(self, target, new_status):
        last_status = self._statuses[target]
        if new_status != last_status:
            self._statuses[target] = new_status

            if new_status == self.STATUS_ALIVE:
                self._set_alive.add(target)
            else:
                self._set_alive.discard(target)

            # print('CHANGE STATUS', target, last_status, '->', new_status)
            if self._cb_status_change:
                self._cb_status_change(target, last_status, new_status)

    def put_metric(self, target, measure):
        clock_time = None
        metric = (clock_time, measure)
        self._metrics[target].appendleft(metric)

    def metric_is_alive(self, metric):
        clock_time, measure = metric

        return measure is not None

    def metrics_to_status(self, target):
        metrics = self._metrics[target]

        state = self.metric_is_alive(metrics[0])
        if state:
            status = self.STATUS_ALIVE
        else:
            status = self.STATUS_UNREACHABLE

        count = 0
        for metric in metrics:
            prev_state = self.metric_is_alive(metric)
            if state == prev_state:
                count += 1
            else:
                break

        return status, count

    def get_metrics(self, target):
        if target in self._set_all:
            return self._metrics[target]
        return []

    def get_status(self, target):
        if target in self._set_all:
            return self._statuses[target]
        return self.STATUS_UNKNOWN

    def len(self):
        return len(self._targets)

    def add(self, target, status=1):
        if target not in self._set_all:
            self._targets.append(target)
            self._metrics[target] = collections.deque(maxlen=self._store_metrics)
            self._statuses[target] = status  # default: STATUS_UNKNOWN
            self._set_all.add(target)

    def get(self, idx):
        return self._targets[idx]

    def _remove(self, idx):
        target = self._targets.pop(idx)

        del self._metrics[target]
        del self._statuses[target]
        self._set_all.discard(target)
        self._set_alive.discard(target)

        if idx < self._next_idx:
            self._next_idx -= 1
        elif self._next_idx >= len(self._targets):
            self._next_idx = 0

    def remove(self, target):
        idx = self._targets.index(target)
        self._remove(idx)

    def next(self):
        target = self.get(self._next_idx)

        self._next_idx += 1
        if self._next_idx >= self.len():
            self._next_idx = 0

        return target


class Poller:
    def __init__(self, loop=None):
        self.loop = loop
        self.req_queue = []

        self._senders = {}
        self._senders_cnt = 0

        self._is_running = False
        own_id = os.getpid() & 0xFFFF
        self._pb = PacketBuilder(own_id)
        self._seq = Sequence()
        self._timeouts = TimeoutScheduler()

    def open_socket(self):
        self.socket = socket.socket(
            socket.AF_INET,
            socket.SOCK_RAW,
            socket.getprotobyname("icmp")
        )
        self.socket.setblocking(False)
        self._fileno = self.socket.fileno()

    def add_target_list(self, target_list):
        self._senders[self._senders_cnt] = target_list
        target_list.register_poller(self._senders_cnt, self)
        self._senders_cnt += 1

    def start(self):
        self._is_running = True
        self.loop.add_reader(self._fileno, self.handle_read)

        for sender_id, sender in self._senders.items():
            sender.handle_enqueue_next()

        self.handle_tick()

    def handle_read(self):
        ICMP_MAX_RECV = 2048  # Max size of incoming buffer

        recv_time = self.loop.time()
        raw_ip_pkt, address = self.socket.recvfrom(ICMP_MAX_RECV)
        raw_icmp_pkt = raw_ip_pkt[20:]  # skip IP header
        target = address[0]  # IP address

        icmp_pkt = self._pb.parse(raw_icmp_pkt)
        if icmp_pkt:
            sender_id = icmp_pkt.sender_id
            sequence = icmp_pkt.sequence
            roundtrip_time = recv_time - icmp_pkt.timestamp

            task_id = ':'.join((target, str(sender_id), str(sequence)))
            try:
                self._timeouts.remove(task_id)
            except KeyError:
                return  # уже был получен таймаут, пакет пришёл слишком поздно

            self._senders[sender_id].handle_reply(target, roundtrip_time)

    def handle_tick(self):
        timestamp = self.loop.time()

        try:
            while True:
                (timeout, id, task_data) = self._timeouts.pop(timestamp)
                sender_id, target = task_data
                self._senders[sender_id].handle_timeout(target)
        except KeyError:
            pass  # очередь пуста

        target = None
        try:
            sender_id, target = self.req_queue.pop(0)
            self.send_ping(sender_id, target)
        except IndexError:
            pass  # очередь пуста

        # планируем следующий вызов
        # ближайший запланированый запрос к следующей цели
        next_req_time = min(map((lambda s: s._next_req_time), self._senders.values()))
        # или истекающий таймаут
        try:
            next_timeout = self._timeouts.next_timeout()
            next_req_time = min(next_req_time, next_timeout)
        except KeyError:
            pass  # очередь пуста

        # время, за которое нужно разобраться с очередью
        time_we_have = next_req_time - timestamp
        # если очередь пуста, мы просто запланируем вызов как раз на время следующего события
        delay = time_we_have / (len(self.req_queue) + 1)
        next_req_time = timestamp + delay

        self._tick_h = self.loop.call_at(next_req_time, self.handle_tick)

    def send_ping(self, sender_id, target):
        sequence = self._seq.next()
        timestamp = self.loop.time()

        task_id = ':'.join((target, str(sender_id), str(sequence)))
        task_timeout = timestamp + 1.0
        task_data = (sender_id, target)
        self._timeouts.add(task_timeout, task_id, task_data)

        raw_icmp_pkt = self._pb.build(sender_id, sequence, timestamp)
        # Port number is irrelevant for ICMP
        self.socket.sendto(raw_icmp_pkt, (target, 1))
