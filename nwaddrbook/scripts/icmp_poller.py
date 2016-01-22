import logging
import asyncio
import signal

import click
import aiopg

from .. import conf
from ..wamp import ApplicationSession, ApplicationRunner
from ..icmp import poller
from ..icmp.util import drop_privileges


def my_add(x, y):
    return x + y


class MyComponent(ApplicationSession):
    def __init__(self, config=None, app_cfg=None, loop=None):
        ApplicationSession.__init__(self, config)

        self.loop = loop
        self.app_cfg = app_cfg

        self.db = None

        self.poller = poller.Poller(loop=loop)
        self.main_targets = poller.TargetsList(period=60.0, store_metrics=10)
        self.poller.add_target_list(self.main_targets)

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

    def onClose(self, wasClean):
        logging.info('exit clean: {0}'.format(wasClean))
        if not wasClean:
            self.loop.stop()

    async def reload_hosts_from_db(self):
        logging.info('loading ips...')
        sql = 'SELECT ip.addr, ip.host_id, ip.network_id FROM host_ip ip'
        with (await self.db.cursor()) as cur:
            await cur.execute(sql)
            for addr, host_id, network_id in (await cur.fetchall()):
                if addr == '::1' or addr == '127.0.0.1':
                    continue
                self.main_targets.add(addr, (host_id, network_id))
        logging.info('loading ips... done')

    def get_host_status(self, host):
        return self.main_targets.get_status(host)

    def get_events_last(self):
        result = []
        for event in self.main_targets.events:
            event_time, event_source, event_from_state, event_to_state = event

            event_time = event_time.timestamp()
            event_extra = self.main_targets.get_extra(event_source)

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
