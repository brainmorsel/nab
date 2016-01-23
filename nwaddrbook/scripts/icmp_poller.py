import logging
import asyncio
import signal

import click
import aiopg

from .. import conf
from ..wamp import ApplicationSession, ApplicationRunner
from ..icmp import poller
from ..icmp.util import drop_privileges


class HostIpAddrItem:
    def __init__(self, id, addr, host_id, network_id):
        self.id = id
        self.addr = addr
        self.host_id = host_id
        self.network_id = network_id


class MyComponent(ApplicationSession):
    def __init__(self, config=None, app_cfg=None, loop=None):
        ApplicationSession.__init__(self, config)

        self.loop = loop
        self.app_cfg = app_cfg

        self.db = None

        self.poller = poller.Poller(loop=loop)
        self.main_targets = poller.TargetsList(period=60.0, store_metrics=10)
        self.poller.add_target_list(self.main_targets)

        self._targets_by_id = {}
        self._targets_by_addr = {}

    async def onJoin(self, details):
        logging.info("Session joined.")

        self.db = await aiopg.create_pool(**self.app_cfg.database.__dict__)

        logging.info("Opening socket...")
        self.poller.open_socket()

        logging.info("Droping privileges...")
        drop_privileges(self.app_cfg.runas.user, self.app_cfg.runas.group)

        logging.info("Starting poller...")
        self.poller.start()

        await self.reload_hosts_from_db()

        try:
            await self.register(self.get_host_status, 'icmp-poller.get_host_status')
            await self.register(self.get_events_last, 'icmp-poller.get_events_last')
            logging.info("Procedure registered.")
        except Exception as e:
            logging.warning("Could not register procedure: {0}".format(e))

        try:
            await self.subscribe(self.on_host_ip_change, 'data.host_ip.change')
        except Exception as e:
            logging.warning("could not subscribe to topic: {0}".format(e))

    def onClose(self, wasClean):
        logging.info('exit clean: {0}'.format(wasClean))
        if not wasClean:
            self.loop.stop()

    def _add_target(self, target):
        if target.id in self._targets_by_id:
            old_target = self._targets_by_id[target.id]
            if target.addr != old_target.addr:
                self.main_targets.remove(old_target.addr)
                del self._targets_by_addr[old_target.addr]
                self.main_targets.add(target.addr)
                self._targets_by_id[target.id] = target
                self._targets_by_addr[target.addr] = target
        else:
            self.main_targets.add(target.addr)
            self._targets_by_id[target.id] = target
            self._targets_by_addr[target.addr] = target

    def _remove_target(self, id):
        target = self._targets_by_id[id]
        self.main_targets.remove(target.addr)
        del self._targets_by_id[target.id]
        del self._targets_by_addr[target.addr]

    async def reload_hosts_from_db(self):
        logging.info('loading ips...')
        new_targets = set()
        sql = 'SELECT ip.ip_id, ip.addr, ip.host_id, ip.network_id FROM host_ip ip'
        with (await self.db.cursor()) as cur:
            await cur.execute(sql)
            for id, addr, host_id, network_id in (await cur.fetchall()):
                if addr == '::1' or addr == '127.0.0.1':
                    continue
                target = HostIpAddrItem(id, addr, host_id, network_id)
                self._add_target(target)
                new_targets.add(id)

        to_delete = set(self._targets_by_id.keys()) - new_targets
        for id in to_delete:
            self._remove_target(id)

        logging.info('loading ips... done')

    async def on_host_ip_change(self):
        await self.reload_hosts_from_db()

    def get_host_status(self, host):
        return self.main_targets.get_status(host)

    def get_events_last(self):
        result = []
        for event in self.main_targets.events:
            event_time, event_source, event_from_state, event_to_state = event

            event_time = event_time.timestamp()
            target = self._targets_by_addr[event_source]
            event_extra = (target.host_id, target.network_id)

            event = event_time, event_source, event_from_state, event_to_state, event_extra
            result.append(event)

        return result


@click.command()
@click.option('-c', '--config', 'config_path', type=click.Path(exists=True, readable=True, dir_okay=False), required=True)
def cli(config_path):
    app_cfg = conf.load(config_path)

    loop = asyncio.get_event_loop()
    try:
        loop.add_signal_handler(signal.SIGTERM, loop.stop)
    except NotImplementedError:
        # signals are not available on Windows
        pass

    logging.info('Init...')
    wamp_runner = ApplicationRunner(
        url=app_cfg.wamp.url,
        realm=app_cfg.wamp.realm,
        loop=loop
    )
    wamp_runner.run(MyComponent, app_cfg)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        wamp_runner.stop()
        # дожидаемся завершения всех оставшихся задач и выходим.
        pending = asyncio.Task.all_tasks()
        loop.run_until_complete(asyncio.gather(*pending))
        loop.close()
