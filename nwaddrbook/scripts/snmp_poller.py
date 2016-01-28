import logging
import asyncio
import signal

import click
import aiopg

from .. import conf
from ..wamp import ApplicationSession, ApplicationRunner
from ..snmp.poller import Poller


class MyComponent(ApplicationSession):
    def __init__(self, config=None, app_cfg=None, loop=None):
        ApplicationSession.__init__(self, config)

        self.loop = loop
        self.app_cfg = app_cfg

        self.db = None

    async def onJoin(self, details):
        logging.info("Session joined.")

        self.db = await aiopg.create_pool(**self.app_cfg.database.__dict__)

        poller = Poller(loop=self.loop)
        poller.open_socket()
        poller.start()

        ips = []
        sql = 'SELECT ip.ip_id, ip.addr, ip.host_id, ip.network_id FROM host_ip ip'
        with (await self.db.cursor()) as cur:
            await cur.execute(sql)
            for id, addr, host_id, network_id in (await cur.fetchall()):
                if addr == '::1' or addr == '127.0.0.1':
                    continue
                ips.append(addr)

        start_at = self.loop.time()
        tasks = []
        for addr in ips:
            tasks.append(poller.request_get(addr, 161, 'public', (('1.3.6.1.2.1.1.1.0', None),)))
        done, _ = await asyncio.wait(tasks)
        end_at = self.loop.time()
        print(
            'DONE:',
            len(list(filter(lambda v: v['success'], map(lambda f: f.result(), done)))),
            '/',
            len(ips),
            end_at - start_at
        )

    def onClose(self, wasClean):
        logging.info('exit clean: {0}'.format(wasClean))
        if not wasClean:
            self.loop.stop()


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
