import logging
import asyncio
import signal
import json
from datetime import datetime
import traceback

import click
import aiopg
import psycopg2
from aiohttp import web
from autobahn.wamp.types import PublishOptions

from .. import conf
from ..wamp import ApplicationSession, ApplicationRunner


class MyComponent(ApplicationSession):
    def __init__(self, config=None, app_cfg=None, loop=None):
        ApplicationSession.__init__(self, config)

        self.loop = loop
        self.app_cfg = app_cfg
        self.db = None
        self.webserver = WebServer(self, loop)

        self._client_id_cache = {}

    async def onJoin(self, details):
        logging.info("Session joined.")
        self.db = await aiopg.create_pool(**self.app_cfg.database.__dict__)
        try:
            await self.subscribe(self.handle_session_start, 'events.client.session.start')
            await self.subscribe(self.handle_session_stop, 'events.client.session.stop')
            await self.subscribe(self.handle_port_owner_update, 'events.client.port.update')
            await self.subscribe(self.handle_client_ip_update, 'events.client.ip.update')
            await self.subscribe(self.handle_client_igmp_update, 'events.client.igmp_profile.update')
        except Exception as e:
            logging.error("could not subscribe to topic: {0}".format(e))

        logging.info('Start web server...')
        await self.webserver.start()

    def onClose(self, wasClean):
        logging.info('exit clean: {0}'.format(wasClean))
        if not wasClean:
            self.loop.stop()
        logging.info('Stop web server...')
        self.loop.create_task(self.webserver.stop())

    async def _get_client_id(self, client_name):
        try:
            return self._client_id_cache[client_name]
        except KeyError:
            sql_client_id = 'SELECT c.client_id FROM client c WHERE c.name = %(client_name)s'
            with (await self.db.cursor()) as cur:
                await cur.execute(sql_client_id, {'client_name': client_name})
                res = await cur.fetchone()
                if res:
                    client_id, = res
                else:
                    sql_insert_client = '''
                        INSERT INTO client (client_type_id, name)
                        VALUES (2, %(client_name)s)
                        RETURNING client_id
                    '''
                    await cur.execute(sql_insert_client, {'client_name': client_name})
                    client_id,  = await cur.fetchone()
                    sql_insert_session = '''
                        INSERT INTO client_current_session (client_id, time_start, time_end)
                        VALUES (%(client_id)s, NULL, NULL)
                    '''
                    await cur.execute(sql_insert_session, {'client_id': client_id})
                self._client_id_cache[client_name] = client_id

                return client_id

    async def handle_session_start(self, event):
        with (await self.db.cursor()) as cur:
            client_id = await self._get_client_id(event['client_name'])
            nas_ip = event.get('nas_ip', None)
            timestamp = datetime.fromtimestamp(event['timestamp'])
            sql_update_session = '''
                UPDATE client_current_session
                SET time_start = %(time_start)s, time_end = %(time_end)s, nas_ip = %(nas_ip)s
                WHERE client_id = %(client_id)s
            '''
            await cur.execute(sql_update_session, {'client_id': client_id, 'time_start': timestamp, 'time_end': None, 'nas_ip': nas_ip})

    async def handle_session_stop(self, event):
        with (await self.db.cursor()) as cur:
            client_id = await self._get_client_id(event['client_name'])
            timestamp = datetime.fromtimestamp(event['timestamp'])
            sql_update_session = '''
                UPDATE client_current_session
                SET time_end = %(time_end)s
                WHERE client_id = %(client_id)s
            '''
            await cur.execute(sql_update_session, {'client_id': client_id, 'time_end': timestamp})

    async def handle_port_owner_update(self, event):
        with (await self.db.cursor()) as cur:
            client_id = await self._get_client_id(event['client_name'])
            port = event['port']
            switch_ip = event.get('switch', None)
            switch_mac = event.get('switch_mac', None)
            client_mac = event.get('client_mac', None)
            if switch_ip:
                sql_select_port_data = '''
                    SELECT po.client_id, po.host_id
                    FROM client_port_owner po
                    JOIN host_ip ip ON po.host_id = ip.host_id
                    WHERE po.port_id = %(port)s AND ip.addr = %(switch_ip)s
                '''
            elif switch_mac:
                return
            else:
                return
            await cur.execute(sql_select_port_data, {'switch_ip': switch_ip, 'port': port, 'switch_mac': switch_mac})
            res = await cur.fetchone()

            async def _do_cleanup():
                sql_delete = '''
                    DELETE FROM client_port_owner
                    WHERE client_id = %(client_id)s
                    RETURNING host_id, port_id
                '''
                await cur.execute(sql_delete, {'client_id': client_id})
                res = await cur.fetchone()
                if res:
                    host_id, port_id = res
                    logging.debug('cleanup port {0}:{1} from client {2}'.format(host_id, port_id, client_id))

            if res:
                po_client_id, po_host_id = res
                async def _do_update():
                    sql_update_port_data = '''
                        UPDATE client_port_owner
                        SET client_id = %(client_id)s
                           ,client_mac = %(client_mac)s
                        WHERE host_id = %(host_id)s AND port_id = %(port)s
                    '''
                    await cur.execute(sql_update_port_data, {
                        'client_id': client_id,
                        'host_id': po_host_id,
                        'port': port,
                        'client_mac': client_mac,
                    })
                try:
                    await _do_update()
                except psycopg2.IntegrityError:
                    # клиент подключился на чужом порту, удаляем запись и повторяем
                    await _do_cleanup()
                    await _do_update()

                if po_client_id != client_id:
                    # новый клиент занял порт, старого клиента
                    # logging.debug('change port {0}:{1} owner {2} -> {3}'.format(switch_ip, port, po_client_id, client_id))
                    pass
            else:
                async def _do_insert():
                    sql_insert_port_data = '''
                        INSERT INTO client_port_owner (host_id, port_id, client_id, client_mac)
                        SELECT ip.host_id, %(port)s, %(client_id)s, %(client_mac)s
                        FROM host_ip ip
                        WHERE ip.addr = %(switch_ip)s
                    '''
                    await cur.execute(sql_insert_port_data, {
                        'client_id': client_id,
                        'switch_ip': switch_ip,
                        'port': port,
                        'client_mac': client_mac,
                    })
                try:
                    await _do_insert()
                except psycopg2.IntegrityError:
                    # клиент подключился на новом ничейном порту
                    await _do_cleanup()
                    await _do_insert()
                # logging.debug('insert port {0}:{1} owner {2}'.format(switch_ip, port, client_id))

    async def handle_client_ip_update(self, event):
        with (await self.db.cursor()) as cur:
            client_id = await self._get_client_id(event['client_name'])
            client_ip = event.get('client_ip')
            sql_update_session = '''
                UPDATE client_current_session
                SET client_ip = %(client_ip)s
                WHERE client_id = %(client_id)s
            '''
            await cur.execute(sql_update_session, {'client_id': client_id, 'client_ip': client_ip})

    async def handle_client_igmp_update(self, event):
        client_id = await self._get_client_id(event['client_name'])
        profile_id = event['profile_id']
        is_active = event['active']
        with (await self.db.cursor()) as cur:
            sql_select_status = '''
                SELECT active FROM client_igmp_profile_status
                WHERE client_id = %(client_id)s AND profile_id = %(profile_id)s
            '''
            await cur.execute(sql_select_status, {'client_id': client_id, 'profile_id': profile_id})
            res = await cur.fetchone()
            if res:
                db_active, = res
                if is_active != db_active:
                    sql_update_status = '''
                        UPDATE client_igmp_profile_status
                        SET active = %(active)s
                           ,update_time = now()
                        WHERE client_id = %(client_id)s AND profile_id = %(profile_id)s
                    '''
                    await cur.execute(sql_update_status, {
                        'client_id': client_id,
                        'profile_id': profile_id,
                        'active': is_active,
                    })
                    logging.debug('update igmp {0} {1}'.format(event['client_name'], is_active))
            else:
                sql_insert_status = '''
                    INSERT INTO client_igmp_profile_status (client_id, profile_id, active)
                    VALUES (%(client_id)s, %(profile_id)s, %(active)s)
                '''
                await cur.execute(sql_insert_status, {
                    'client_id': client_id,
                    'profile_id': profile_id,
                    'active': is_active,
                })


class WebServer:
    def __init__(self, wamp, loop):
        self._srv = None
        self._handler = None
        self._loop = loop
        self.app = None
        self.wamp = wamp
        self.app_cfg = wamp.app_cfg

    async def start(self):
        self.app = web.Application()
        self.app.wamp = self.wamp

        self.app.router.add_route('POST', '/smartasr', self.handle_post_events)

        self._handler = self.app.make_handler()
        self._srv = await self._loop.create_server(
            self._handler,
            self.app_cfg.http.listen,
            int(self.app_cfg.http.port))

    async def stop(self):
        await self._handler.finish_connections(1.0)
        self._srv.close()
        await self._srv.wait_closed()
        await self.app.finish()

    async def handle_post_events(self, request):
        result = {'success': False, 'error': 'Incorrect request.'}
        logging.debug('handle_post_events: got HTTP POST request')
        if request.method == 'POST' and request.content_type == 'application/json':
            data = await request.json()
            try:
                logging.debug('handle_post_events: get {0} events in batch'.format(len(data['events'])))
                for event in data['events']:
                    ev_type = event['event']
                    logging.debug('handle_post_events: dispatch event {0}'.format(ev_type))
                    if ev_type == 'session-start':
                        self.wamp.publish('events.client.session.start', event, options=PublishOptions(exclude_me=False))
                    elif ev_type == 'session-stop':
                        self.wamp.publish('events.client.session.stop', event, options=PublishOptions(exclude_me=False))
                    elif ev_type == 'port-owner-update':
                        self.wamp.publish('events.client.port.update', event, options=PublishOptions(exclude_me=False))
                    elif ev_type == 'client-ip-update':
                        self.wamp.publish('events.client.ip.update', event, options=PublishOptions(exclude_me=False))
                    elif ev_type == 'client-igmp-update':
                        self.wamp.publish('events.client.igmp_profile.update', event, options=PublishOptions(exclude_me=False))

            except Exception:
                logging.error('Error {0}\n{1}'.format(event, traceback.format_exc()))

        return web.Response(text=json.dumps(result), content_type='application/json')


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
