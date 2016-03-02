import logging
import asyncio
import signal

import click
import aiopg

from .. import conf
from ..wamp import ApplicationSession, ApplicationRunner
from ..snmp.poller import Poller
from ..snmp import profile


class MyComponent(ApplicationSession):
    def __init__(self, config=None, app_cfg=None, loop=None):
        ApplicationSession.__init__(self, config)

        self.loop = loop
        self.app_cfg = app_cfg

        self.db = None

    async def onJoin(self, details):
        logging.info("Session joined.")

        self.db = await aiopg.create_pool(**self.app_cfg.database.__dict__)

        self.poller = Poller(loop=self.loop)
        self.poller.open_socket()
        self.poller.start()

        # await self.device_discovery('172.16.56.159', 2777)
        # await self.device_discovery('172.26.3.14')  # ner
        # await self.device_discovery('172.20.0.43')  # angarsk
        # await self.device_discovery('172.17.5.153')  # ONT
        # await self.device_discovery('172.16.5.30')  # UPS APC
        # await self.device_discovery('172.16.30.9')  # UPS Delta NOT RESPOND
        # await self.device_discovery('172.16.5.3')  # UPS Liebert
        # await self.device_discovery('172.16.90.109')  # UPS Qtech NOT RESPOND

        dev_profile = profile.profile_factory('1.3.6.1.4.1.171.10.113.1.5', self.poller, '172.30.7.182')
        # for port in range(5):
        #    res = await dev_profile.mcast_profile_status(port+1, 2)
        #    print(port+1, res['result'])
        print('status', (await dev_profile.mcast_profile_status(3, 2))['result'])
        #print(await dev_profile.mcast_profile_enable(3, 2))
        print(await dev_profile.mcast_profile_disable(3, 2))
        print('status', (await dev_profile.mcast_profile_status(3, 2))['result'])

    async def scan_inventory_data(self):
        tasks = []
        start_at = self.loop.time()
        sql = 'SELECT ip.addr, ip.host_id FROM host_ip ip'
        with (await self.db.cursor()) as cur:
            await cur.execute(sql)
            for addr, host_id in (await cur.fetchall()):
                if addr == '::1' or addr == '127.0.0.1':
                    continue
                task = self.device_discovery(addr, host_id)
                tasks.append(task)

        done, _ = await asyncio.wait(tasks)
        end_at = self.loop.time()
        print('DONE', end_at - start_at)

    async def _save_inventory_data(self, host_id, read_comm, write_comm, sys_oid, sys_descr):
        sql_insert_inventory = '''
            INSERT INTO host_snmp_inventory (host_id, sys_oid, sys_descr)
            VALUES (%(host_id)s, %(sys_oid)s, %(sys_descr)s)
        '''
        sql_delete_inventory = '''
            DELETE FROM host_snmp_inventory WHERE host_id = %(host_id)s
        '''
        sql_update_community = '''
            UPDATE host
            SET snmp_community_public = %(cr)s, snmp_community_private = %(cw)s
            WHERE host_id = %(host_id)s
        '''
        with (await self.db.cursor()) as cur:
            await cur.execute(sql_delete_inventory, {'host_id': host_id})
            await cur.execute(sql_insert_inventory, {'host_id': host_id, 'sys_oid': sys_oid, 'sys_descr': sys_descr})
            await cur.execute(sql_update_community, {'host_id': host_id, 'cr': read_comm, 'cw': write_comm})

    async def device_discovery(self, addr, host_id=None):
        read_comms = ['public', 'apnqqwpasswd', 'xe4rf', 'LiebertEM']
        write_comms = ['private', 'apnqqwpasswd', 'xe4rf', 'LiebertEM']

        OID_sysDescr = '1.3.6.1.2.1.1.1.0'
        OID_sysContact = '1.3.6.1.2.1.1.4.0'
        OID_sysObjectID = '1.3.6.1.2.1.1.2.0'
        port = 161

        descr = None
        contact = None
        read_comm = None
        write_comm = None
        sys_oid = None
        for rcomm in read_comms:
            res = await self.poller.request_get(addr, port, rcomm, (
                (OID_sysDescr, None),
                (OID_sysContact, None),
                (OID_sysObjectID, None),
            ))
            if res['success']:
                read_comm = rcomm
                bSysDescr, bSysContact, bSysObjectID = res['result']
                _, descr = bSysDescr
                _, contact = bSysContact
                _, sys_oid = bSysObjectID
                break
            else:
                if res['error'] != 'timeout':
                    print(addr, res)

        for wcomm in write_comms:
            res = await self.poller.request_set(addr, port, wcomm, (
                (OID_sysContact, contact),
            ))
            if res['success']:
                write_comm = wcomm
                break
        # print(addr, read_comm, write_comm, str(sys_oid), str(descr))
        if sys_oid or descr:
            await self._save_inventory_data(host_id, read_comm, write_comm, str(sys_oid), str(descr))

    async def test_run(self):
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
            tasks.append(self.poller.request_get(addr, 161, 'public', (('1.3.6.1.2.1.1.1.0', None),)))
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
