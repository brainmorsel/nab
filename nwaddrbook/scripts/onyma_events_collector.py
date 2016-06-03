import logging
import json
import time
import asyncio

import stomp
import click

from . import script_wamp_runner
from ..wamp import ApplicationSession


class MyComponent(ApplicationSession):
    def __init__(self, config=None, app_cfg=None, loop=None):
        ApplicationSession.__init__(self, config)

        self.loop = loop
        self.app_cfg = app_cfg

    async def onJoin(self, details):
        logging.info("Session joined.")

        conn = stomp.Connection(host_and_ports=[(self.app_cfg.stomp.host, self.app_cfg.stomp.port)])
        conn.set_listener('', MyListener(conn, self))
        conn.start()
        conn.connect(login=self.app_cfg.stomp.login, passcode=self.app_cfg.stomp.password, wait=True)
        conn.subscribe(destination=self.app_cfg.stomp.destination, id=1,
                ack='client', headers={'activemq.prefetchSize': self.app_cfg.stomp.prefetchSize})

    def onClose(self, wasClean):
        logging.info('exit clean: %s', wasClean)
        if not wasClean:
            self.loop.stop()

    def send_event(self, ev_name, ev_data):
        logging.debug('send event %s %s', ev_name, ev_data)
        asyncio.ensure_future(self.call(ev_name, ev_data))


def nil2none(obj):
    if isinstance(obj, dict) and '@nil' in obj:
        return None
    else:
        return obj


class MyListener(stomp.ConnectionListener):
    def __init__(self, conn, wamp):
        self.conn = conn
        self.wamp = wamp

    def on_error(self, headers, message):
        logging.error('received an error "%s"', message)

    def on_message(self, headers, message):
        data = json.loads(message)
        data = data['notifyRequest']
        if 'p_login' in data and isinstance(data['p_login'], str):
            e_name = data['event']
            e_login = data['p_login']
            e_status = nil2none(data['p_status'])
            e_srv_id = data['p_clsrv']
            e_parent_srv_id = data.get('p_parent_clsrv')

            if e_name == 'UPDATE':
                e_circuit_id = data.get('p_newvalue')
                if e_circuit_id:
                    self.handle_port_owner_update(e_login, e_circuit_id)

            if e_status is not None:
                self.handle_client_igmp_update(e_login, int(e_status))

        ack = True
        if ack:
            self.conn.ack(id=headers['message-id'], subscription=headers['subscription'])

    def handle_port_owner_update(self, client_name, circuit_id):
        timestamp = int(time.time())
        items = circuit_id.split('::', 3)
        if len(items) == 3:
            # dlink
            mac, ip, port = items
            ev = {
                'event': 'port-owner-update',
                'timestamp': timestamp,
                'client_name': client_name,
                'client_mac': mac,
                'switch': ip,
                'switch_mac': None,
                'port': port,
            }
            self.wamp.send_event('events.client.port.update', ev)

    def handle_client_igmp_update(self, client_name, onyma_status):
        profile_id = 2
        is_active = onyma_status == 0
        ev = {
            'event': 'client-igmp-update',
            'profile_id': profile_id,
            'client_name': client_name,
            'active': is_active,
        }
        self.wamp.send_event('events.client.igmp_profile.update', ev)


@click.command()
@click.option('-c', '--config', 'config_path', type=click.Path(exists=True, readable=True, dir_okay=False), required=True)
def cli(config_path):
    script_wamp_runner(MyComponent, config_path)
