import socket
import asyncio

import pysnmp.proto.api
from pyasn1.codec.ber import encoder, decoder

from ..sched import TimeoutScheduler


class Task:
    def __init__(self, pMod, type, host, port, community, var_binds):
        self.pMod = pMod  # SNMP proto module
        self.type = type
        self.host = host
        self.port = port
        self.community = community
        self.var_binds = var_binds
        self.timeout = 3.0
        self.future = None

        self.id = None
        self._rawMsg = None

    def handle_success(self, var_binds):
        if self.future:
            self.future.set_result({'success': True, 'result': var_binds})
            self.future = None

    def handle_error(self, errorName, errorIndex):
        if self.future:
            self.future.set_result({'success': False, 'error': errorName, 'errorIndex': errorIndex})
            self.future = None

    def handle_timeout(self):
        if self.future:
            self.future.set_result({'success': False, 'error': 'timeout'})
            self.future = None

    def handle_exception(self, e):
        if self.future:
            self.future.set_exception(e)
            self.future = None

    def raw_msg(self):
        if self._rawMsg is None:
            pMod = self.pMod
            # Build PDU
            if self.type == 'GET':
                reqPDU = pMod.GetRequestPDU()
            elif self.type == 'SET':
                reqPDU = pMod.SetRequestPDU()

            pMod.apiPDU.setDefaults(reqPDU)
            pMod.apiPDU.setVarBinds(reqPDU, self.var_binds)
            # Build message
            reqMsg = pMod.Message()
            pMod.apiMessage.setDefaults(reqMsg)
            pMod.apiMessage.setCommunity(reqMsg, self.community)
            pMod.apiMessage.setPDU(reqMsg, reqPDU)

            reqId = pMod.apiPDU.getRequestID(reqPDU)
            self.id = ':'.join((str(self.host), str(self.port), str(reqId)))

            self._rawMsg = encoder.encode(reqMsg)

        return self._rawMsg


class Poller:
    def __init__(self, loop=None):
        self.loop = loop
        self._req_queue = []
        self._writing = False
        self._timeouts = TimeoutScheduler()
        self._requests = {}  # current sended requests

        self.p1 = pysnmp.proto.api.protoModules[pysnmp.proto.api.protoVersion1]
        self.p2 = pysnmp.proto.api.protoModules[pysnmp.proto.api.protoVersion2c]

    def open_socket(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.setblocking(False)
        self._fileno = self.socket.fileno()
        self.socket.bind(('', 0))

    def start(self):
        self.loop.add_reader(self._fileno, self.handle_read)

        self.handle_tick()

    def handle_tick(self):
        timestamp = self.loop.time()

        while True:
            try:
                (timeout, task_id, task) = self._timeouts.pop(timestamp)
            except KeyError:
                break  # очередь пуста
            del self._requests[task_id]
            task.handle_timeout()

        delay = 0
        try:
            delay = self._timeouts.next_timeout() - timestamp
        except KeyError:
            # очередь пуста
            pass

        next_tick = timestamp + max(delay, 0.1)
        self._tick_h = self.loop.call_at(next_tick, self.handle_tick)

    def handle_read(self):
        rawMsg, addr = self.socket.recvfrom(65535)
        host, port = addr

        pMod = self.p2
        while rawMsg:
            rspMsg, rawMsg = decoder.decode(rawMsg, asn1Spec=pMod.Message())
            rspPDU = pMod.apiMessage.getPDU(rspMsg)

            reqId = pMod.apiPDU.getRequestID(rspPDU)
            task_id = ':'.join((str(host), str(port), str(reqId)))

            try:
                self._timeouts.remove(task_id)
            except KeyError:
                continue  # уже был получен таймаут, пакет пришёл слишком поздно

            task = self._requests[task_id]
            del self._requests[task_id]

            errorStatus = pMod.apiPDU.getErrorStatus(rspPDU)
            if errorStatus:
                nv = errorStatus.getNamedValues()
                errorName = nv.getName(errorStatus)
                errorIndex = pMod.apiPDU.getErrorIndex(rspPDU, muteErrors=True)
                task.handle_error(errorName, int(errorIndex))
            else:
                var_binds = pMod.apiPDU.getVarBinds(rspPDU)
                task.handle_success(var_binds)

    def send_task(self, task):
        rawMsg = task.raw_msg()

        timestamp = self.loop.time()
        task_timeout = timestamp + task.timeout
        self._timeouts.add(task_timeout, task.id, task)
        self._requests[task.id] = task

        self.socket.sendto(rawMsg, (task.host, task.port))

    def enqueue_task(self, task):
        self._req_queue.append(task)
        self._check_queue()
        return len(self._req_queue)

    def handle_write(self):
        if len(self._req_queue) > 0:
            task = self._req_queue.pop(0)
            try:
                self.send_task(task)
            except Exception as e:
                task.handle_exception(e)
        self._check_queue()

    def _check_queue(self):
        if self._writing and len(self._req_queue) == 0:
            self._writing = False
            self.loop.remove_writer(self._fileno)
        elif not self._writing and len(self._req_queue) > 0:
            self._writing = True
            self.loop.add_writer(self._fileno, self.handle_write)

    def request_get(self, host, port, community, var_binds):
        return self._request('GET', host, port, community, var_binds)

    def request_set(self, host, port, community, var_binds):
        return self._request('SET', host, port, community, var_binds)

    def _request(self, type, host, port, community, var_binds):
        task = Task(self.p2, type, host, port, community, var_binds)
        future = asyncio.Future(loop=self.loop)
        task.future = future
        self.enqueue_task(task)
        return future
