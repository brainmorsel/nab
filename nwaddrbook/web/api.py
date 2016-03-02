from datetime import datetime
import re
import traceback
import logging

import psycopg2
from psycopg2.extras import Json


class User:
    pass


def Success(result):
    return {'success': True, 'result': result}


def Fail(error):
    return {'success': False, 'error': str(error)}


class Provider:
    def __init__(self, app):
        self._db = app.db
        self._wamp = app.wamp

    async def request(self, user, request_obj):
        try:
            options = request_obj.get('options', {})
            handlers = Handlers(self._db, self._wamp, user, options)
            action = request_obj.get('action')
            params = request_obj.get('params', {})
            handler = getattr(handlers, action)

            return Success(await handler(**params))
        except psycopg2.OperationalError as error:
            logging.error(traceback.format_exc())
            await self._db.clear()
            return Fail(error)
        except Exception as error:
            logging.error(traceback.format_exc())
            return Fail(error)


class Handlers:
    SQL_GET_GROUP = '''
        SELECT g.group_id, g.parent_id, g.name, g.group_type_id, gt.name as group_type, gt.icon_name
        FROM "group" g
        JOIN group_type gt ON g.group_type_id = gt.group_type_id
    '''

    SQL_GET_GROUPS_RECURSIVE = '''
        WITH RECURSIVE search_graph(group_id, parent_id, name, group_type_id, depth) AS (
            SELECT g.group_id, g.parent_id, g.name, g.group_type_id, 1
            FROM "group" g
            WHERE g.group_id IN %(ids)s
          UNION ALL
            SELECT g.group_id, g.parent_id, g.name, g.group_type_id, sg.depth + 1
            FROM "group" g, search_graph sg
            WHERE g.group_id = sg.parent_id
        )
        SELECT g.group_id, g.parent_id, g.name, g.group_type_id, gt.name as group_type, gt.icon_name FROM search_graph g
        JOIN group_type gt ON g.group_type_id = gt.group_type_id
    '''

    SQL_GET_HOST = '''
        SELECT h.host_id, h.group_id, h.name, h.host_type_id, h.snmp_community_public, h.snmp_community_private, h.data, h.description
        FROM host h
    '''

    SQL_GET_NETWORK = '''
        SELECT n.network_id, n.parent_id, n.name, n.addr, n.vlan_id, n.vlan_qinq_id, n.mpls_id
        FROM network n
    '''

    SQL_GET_HOST_IP = '''
        SELECT ip.ip_id, ip.host_id, ip.interface_name, ip.network_id, ip.addr
        FROM host_ip ip
    '''

    SQL_GET_HOST_MAC = '''
        SELECT mac.mac_id, mac.host_id, mac.interface_name, mac.addr
        FROM host_mac mac
    '''

    SQL_UPDATE_NETWORK = '''
        UPDATE network SET
            name=%(name)s,
            addr=%(addr)s,
            vlan_id=%(vlan_id)s,
            vlan_qinq_id=%(vlan_qinq_id)s,
            mpls_id=%(mpls_id)s
        WHERE network_id = %(network_id)s
    '''

    SQL_CREATE_NETWORK = '''
        INSERT INTO network (name, addr, vlan_id, vlan_qinq_id, mpls_id, parent_id)
        VALUES (%(name)s, %(addr)s, %(vlan_id)s, %(vlan_qinq_id)s, %(mpls_id)s, %(parent_id)s)
    '''

    SQL_GET_GROUP_TYPE = '''
        SELECT gt.group_type_id, gt.name, gt.icon_name
        FROM group_type gt
    '''

    SQL_GET_HOST_TYPE = '''
        SELECT ht.host_type_id, ht.name
        FROM host_type ht
    '''

    SQL_UPDATE_GROUP = '''
        UPDATE "group" SET name=%(name)s, group_type_id=%(group_type_id)s
        WHERE group_id = %(group_id)s
    '''

    SQL_MOVE_GROUP = '''
        UPDATE "group" SET parent_id=%(parent_id)s
        WHERE group_id = %(group_id)s
    '''

    SQL_CREATE_GROUP = '''
        INSERT INTO "group" (parent_id, group_type_id, name)
        VALUES (%(parent_id)s, %(group_type_id)s, %(name)s)
    '''

    SQL_UPDATE_HOST = '''
        UPDATE host SET
            name=%(name)s,
            host_type_id=%(host_type_id)s,
            snmp_community_public=%(snmp_community_public)s,
            snmp_community_private=%(snmp_community_private)s,
            data=%(data)s,
            description=%(description)s
        WHERE host_id = %(host_id)s
    '''

    SQL_MOVE_HOST = '''
        UPDATE host SET
            group_id=%(group_id)s
        WHERE host_id = %(host_id)s
    '''

    SQL_CREATE_HOST = '''
        INSERT INTO host (group_id, host_type_id, name, snmp_community_public, snmp_community_private, data, description)
        VALUES (%(group_id)s, %(host_type_id)s, %(name)s, %(snmp_community_public)s, %(snmp_community_private)s, %(data)s, %(description)s)
    '''

    SQL_UPDATE_GROUP_TYPE = '''
        UPDATE group_type SET
            name=%(name)s,
            icon_name=%(icon_name)s
        WHERE group_type_id = %(group_type_id)s
    '''

    SQL_CREATE_GROUP_TYPE = '''
        INSERT INTO group_type (name, icon_name)
        VALUES (%(name)s, %(icon_name)s)
    '''

    SQL_UPDATE_HOST_TYPE = '''
        UPDATE host_type SET
            name=%(name)s
        WHERE host_type_id = %(host_type_id)s
    '''

    SQL_CREATE_HOST_TYPE = '''
        INSERT INTO host_type (name)
        VALUES (%(name)s)
    '''

    SQL_UPDATE_HOST_IP = '''
        UPDATE host_ip SET
            addr=%(addr)s,
            interface_name=%(interface_name)s,
            network_id=%(network_id)s
        WHERE ip_id = %(ip_id)s
    '''

    SQL_CREATE_HOST_IP = '''
        INSERT INTO host_ip (addr, host_id, interface_name, network_id)
        VALUES (%(addr)s, %(host_id)s, %(interface_name)s, %(network_id)s)
        RETURNING ip_id
    '''

    SQL_CREATE_HOST_IP_STATUS = '''
        INSERT INTO host_ip_icmp_status (ip_id, icmp_status, last_change_time)
        VALUES (%(ip_id)s, 1, now())
    '''

    SQL_UPDATE_HOST_MAC = '''
        UPDATE host_mac SET
            addr=%(addr)s,
            interface_name=%(interface_name)s
        WHERE mac_id = %(mac_id)s
    '''

    SQL_CREATE_HOST_MAC = '''
        INSERT INTO host_mac (addr, host_id, interface_name)
        VALUES (%(addr)s, %(host_id)s, %(interface_name)s)
    '''

    SQL_DELETE_HOST_IP = '''
        DELETE FROM host_ip WHERE ip_id = %(ip_id)s
    '''

    SQL_DELETE_HOST_MAC = '''
        DELETE FROM host_mac WHERE mac_id = %(mac_id)s
    '''

    SQL_DELETE_HOST = '''
        DELETE FROM host WHERE host_id = %(host_id)s
    '''

    SQL_DELETE_GROUP = '''
        DELETE FROM "group" WHERE group_id = %(group_id)s
    '''

    SQL_DELETE_NETWORK = '''
        DELETE FROM network WHERE network_id = %(network_id)s
    '''

    def __init__(self, db, wamp, user, options):
        self.db = db
        self.wamp = wamp
        self.user = user
        self.options = options

    async def group_get_children(self, group_id=None):
        children = []
        sideload = []

        with (await self.db.cursor()) as cur:
            if group_id is None:
                sql = self.SQL_GET_GROUP + ' WHERE g.parent_id is NULL ORDER BY g.group_type_id, g.name'
            else:
                sql = self.SQL_GET_GROUP + ' WHERE g.parent_id = %(parent_id)s ORDER BY g.group_type_id, g.name'

            await cur.execute(sql, dict(parent_id=group_id))
            for id, parent_id, name, type_id, type_name, icon_name in await cur.fetchall():
                children.append({
                    'type': 'group',
                    'group_id': id,
                })
                sideload.append({
                    'type': 'group',
                    'group_id': id,
                    'parent_id': parent_id,
                    'name': name,
                    'group_type_id': type_id,
                    'group_type_name': type_name,
                    'icon_name': icon_name
                })

            if group_id is not None:
                sql = self.SQL_GET_HOST + ' WHERE h.group_id = %(parent_id)s ORDER BY h.name'
                await cur.execute(sql, dict(parent_id=group_id))
                for id, group_id, name, type_id, snmp_public, snmp_private, data, description in await cur.fetchall():
                    children.append({
                        'type': 'host',
                        'host_id': id,
                    })
                    sideload.append({
                        'type': 'host',
                        'host_id': id,
                        'name': name,
                        'group_id': group_id,
                        'host_type_id': type_id,
                        'snmp_community_public': snmp_public,
                        'snmp_community_private': snmp_private,
                        'data': data,
                        'description': description,
                    })

        return {
            'children': children,
            'sideload': sideload,
        }

    async def network_get_children(self, network_id=None):
        children = []
        sideload = []

        with (await self.db.cursor()) as cur:
            if network_id is None:
                sql = self.SQL_GET_NETWORK + ' WHERE n.parent_id is NULL'
            else:
                sql = self.SQL_GET_NETWORK + ' WHERE n.parent_id = %(parent_id)s'

            await cur.execute(sql, dict(parent_id=network_id))
            for id, parent_id, name, addr, vlan_id, vlan_qinq_id, mpls_id in await cur.fetchall():
                children.append({
                    'type': 'network',
                    'network_id': id,
                })
                sideload.append({
                    'type': 'network',
                    'network_id': id,
                    'parent_id': parent_id,
                    'name': name,
                    'addr': addr,
                    'vlan_id': vlan_id,
                    'vlan_qinq_id': vlan_qinq_id,
                    'mpls_id': mpls_id,
                })

        return {
            'children': children,
            'sideload': sideload,
        }

    async def network_get_all(self):
        ids = []
        sideload = []

        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_NETWORK
            await cur.execute(sql)
            for id, parent_id, name, addr, vlan_id, vlan_qinq_id, mpls_id in await cur.fetchall():
                ids.append(id)
                sideload.append({
                    'type': 'network',
                    'network_id': id,
                    'parent_id': parent_id,
                    'name': name,
                    'addr': addr,
                    'vlan_id': vlan_id,
                    'vlan_qinq_id': vlan_qinq_id,
                    'mpls_id': mpls_id,
                })

        return {
            'ids': ids,
            'sideload': sideload,
        }

    async def host_get_ips(self, host_id):
        ips = []
        sideload = []

        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_HOST_IP + ' WHERE ip.host_id = %(id)s ORDER BY ip.addr'

            await cur.execute(sql, dict(id=host_id))
            for id, _, interface_name, network_id, addr in await cur.fetchall():
                ips.append(id)
                sideload.append({
                    'type': 'host_ip',
                    'ip_id': id,
                    'host_id': host_id,
                    'interface_name': interface_name,
                    'network_id': network_id,
                    'addr': addr,
                })

        return {
            'ips': ips,
            'sideload': sideload,
        }

    async def host_get_macs(self, host_id):
        macs = []
        sideload = []

        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_HOST_MAC + ' WHERE mac.host_id = %(id)s'

            await cur.execute(sql, dict(id=host_id))
            for id, _, interface_name, addr in await cur.fetchall():
                macs.append(id)
                sideload.append({
                    'type': 'host_mac',
                    'mac_id': id,
                    'host_id': host_id,
                    'interface_name': interface_name,
                    'addr': addr,
                })

        return {
            'macs': macs,
            'sideload': sideload,
        }

    async def network_get(self, network_id):
        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_NETWORK + ' WHERE n.network_id = %(id)s'
            await cur.execute(sql, dict(id=network_id))
            id, parent_id, name, addr, vlan_id, vlan_qinq_id, mpls_id = await cur.fetchone()
            return {'network': {
                'type': 'network',
                'network_id': id,
                'parent_id': parent_id,
                'name': name,
                'addr': addr,
                'vlan_id': vlan_id,
                'vlan_qinq_id': vlan_qinq_id,
                'mpls_id': mpls_id,
            }}

    async def group_type_get_all(self):
        items = []
        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_GROUP_TYPE
            await cur.execute(sql)

            for id, name, icon_name in await cur.fetchall():
                items.append({
                    'type': 'group_type',
                    'group_type_id': id,
                    'name': name,
                    'icon_name': icon_name,
                })
        return {'items': items}

    async def host_type_get_all(self):
        items = []
        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_HOST_TYPE
            await cur.execute(sql)

            for id, name in await cur.fetchall():
                items.append({
                    'type': 'host_type',
                    'host_type_id': id,
                    'name': name,
                })
        return {'items': items}

    async def client_type_get_all(self):
        sql = '''
            SELECT ct.client_type_id, ct.name, ct.description
            FROM client_type ct
        '''
        items = []
        with (await self.db.cursor()) as cur:
            await cur.execute(sql)

            for id, name, description in await cur.fetchall():
                items.append({
                    'type': 'client_type',
                    'client_type_id': id,
                    'name': name,
                    'description': description,
                })
        return {'items': items}

    async def host_get_clients(self, host_id):
        sql = '''
            SELECT
                c.client_id, c.name, c.description, po.port_id, ct.client_type_id,
                ct.name as client_type_name, po.client_mac, po.update_time,
                cs.time_start, cs.time_end, cs.nas_ip, cs.client_ip,
                s.profile_id, s.active, s.update_time
            FROM client_port_owner po
            JOIN client c ON c.client_id = po.client_id
            JOIN client_type ct ON c.client_type_id = ct.client_type_id
            JOIN client_current_session cs ON cs.client_id = c.client_id
            LEFT JOIN client_igmp_profile_status s ON s.client_id = c.client_id
            WHERE po.host_id = %(host_id)s
            ORDER BY po.port_id
        '''
        clients = []

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, dict(host_id=host_id))
            for client_id, name, description, port_id, client_type_id, client_type_name, \
                    client_mac, update_time, cs_time_start, cs_time_end, nas_ip, client_ip, \
                    igmp_profile_id, igmp_profile_active, igmp_profile_update_time in await cur.fetchall():
                clients.append({
                    'client_id': client_id,
                    'name': name,
                    'description': description,
                    'port_id': port_id,
                    'client_type_id': client_type_id,
                    'client_type_name': client_type_name,
                    'client_mac': client_mac,
                    'update_time_ts': update_time and update_time.timestamp(),
                    'update_time': update_time and update_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'session': {
                        'time_start_ts': cs_time_start and cs_time_start.timestamp(),
                        'time_start': cs_time_start and cs_time_start.strftime('%Y-%m-%d %H:%M:%S'),
                        'time_end_ts': cs_time_end and cs_time_end.timestamp(),
                        'time_end': cs_time_end and cs_time_end.strftime('%Y-%m-%d %H:%M:%S'),
                        'nas_ip': nas_ip,
                        'client_ip': client_ip
                    },
                    'igmp': {
                        'profile_id': igmp_profile_id,
                        'active': igmp_profile_active,
                        'update_time': igmp_profile_update_time and igmp_profile_update_time.strftime('%Y-%m-%d %H:%M:%S'),
                    },
                })

        return {
            'clients': clients
        }

    async def group_save(self, name, group_type_id, group_id=None, parent_id=None, **kwargs):
        # group_id == None - создать новую группу
        if group_id is None:
            sql = self.SQL_CREATE_GROUP
        else:
            sql = self.SQL_UPDATE_GROUP

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'name': name,
                'group_type_id': group_type_id,
                'parent_id': parent_id,
                'group_id': group_id,
            })
        return 'ok'

    async def host_get_batch(self, ids):
        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_HOST + ' WHERE h.host_id in %(ids)s'
            hosts = []
            group_ids = set()

            await cur.execute(sql, dict(ids=tuple(ids)))
            for id, group_id, name, host_type_id, snmp_community_public, snmp_community_private, data, description in await cur.fetchall():
                group_ids.add(group_id)
                hosts.append({
                    'type': 'host',
                    'host_id': id,
                    'group_id': group_id,
                    'name': name,
                    'host_type_id': host_type_id,
                    'snmp_community_public': snmp_community_public,
                    'snmp_community_private': snmp_community_private,
                    'data': data,
                    'description': description,
                })

            groups = []
            if len(group_ids) > 0:
                await cur.execute(self.SQL_GET_GROUPS_RECURSIVE, dict(ids=tuple(group_ids)))
                for id, parent_id, name, type_id, type_name, icon_name in await cur.fetchall():
                    groups.append({
                        'type': 'group',
                        'group_id': id,
                        'parent_id': parent_id,
                        'name': name,
                        'group_type_id': type_id,
                        'group_type_name': type_name,
                        'icon_name': icon_name
                    })

            return {
                'hosts': hosts,
                'groups': groups,
            }

    async def group_get_batch(self, ids):
        with (await self.db.cursor()) as cur:
            group_ids = ids
            groups = []
            if len(group_ids) > 0:
                await cur.execute(self.SQL_GET_GROUPS_RECURSIVE, dict(ids=tuple(group_ids)))
                for id, parent_id, name, type_id, type_name, icon_name in await cur.fetchall():
                    groups.append({
                        'type': 'group',
                        'group_id': id,
                        'parent_id': parent_id,
                        'name': name,
                        'group_type_id': type_id,
                        'group_type_name': type_name,
                        'icon_name': icon_name
                    })

            return {
                'groups': groups,
            }

    async def host_save(self, name, host_type_id, snmp_community_public, snmp_community_private, data, description, host_id=None, group_id=None, **kwargs):
        # host_id == None - создать новую
        if host_id is None:
            sql = self.SQL_CREATE_HOST
        else:
            sql = self.SQL_UPDATE_HOST

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'name': name,
                'host_type_id': host_type_id,
                'host_id': host_id,
                'snmp_community_public': snmp_community_public,
                'snmp_community_private': snmp_community_private,
                'data': Json(data),
                'group_id': group_id,
                'description': description,
            })
        return 'ok'

    async def group_type_save(self, name, icon_name, group_type_id=None):
        if group_type_id is None:
            sql = self.SQL_CREATE_GROUP_TYPE
        else:
            sql = self.SQL_UPDATE_GROUP_TYPE

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'name': name,
                'icon_name': icon_name,
                'group_type_id': group_type_id,
            })
        return 'ok'

    async def host_type_save(self, name, host_type_id=None):
        if host_type_id is None:
            sql = self.SQL_CREATE_HOST_TYPE
        else:
            sql = self.SQL_UPDATE_HOST_TYPE

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'name': name,
                'host_type_id': host_type_id,
            })
        return 'ok'

    async def network_save(self, name, addr, vlan_id=None, vlan_qinq_id=None, mpls_id=None, network_id=None, parent_id=None):
        if network_id is None:
            sql = self.SQL_CREATE_NETWORK
        else:
            sql = self.SQL_UPDATE_NETWORK

        if vlan_id == '':
            vlan_id = None
        if vlan_qinq_id == '':
            vlan_qinq_id = None
        if mpls_id == '':
            mpls_id = None

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'name': name,
                'network_id': network_id,
                'parent_id': parent_id,
                'addr': addr,
                'vlan_id': vlan_id,
                'vlan_qinq_id': vlan_qinq_id,
                'mpls_id': mpls_id,
            })
        return 'ok'

    async def host_ip_save(self, addr, network_id, host_id, interface_name=None, ip_id=None, **kwargs):
        if ip_id is None:
            sql = self.SQL_CREATE_HOST_IP
        else:
            sql = self.SQL_UPDATE_HOST_IP

        if interface_name == '':
            interface_name = None

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'addr': addr,
                'interface_name': interface_name,
                'network_id': network_id,
                'host_id': host_id,
                'ip_id': ip_id,
            })
            if ip_id is None:
                ip_id, = await cur.fetchone()
                await cur.execute(self.SQL_CREATE_HOST_IP_STATUS, dict(ip_id=ip_id))
            self.wamp.publish('data.host_ip.change')

        return 'ok'

    async def host_mac_save(self, addr, host_id, interface_name=None, mac_id=None, **kwargs):
        if mac_id is None:
            sql = self.SQL_CREATE_HOST_MAC
        else:
            sql = self.SQL_UPDATE_HOST_MAC

        if interface_name == '':
            interface_name = None

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'addr': addr,
                'interface_name': interface_name,
                'host_id': host_id,
                'mac_id': mac_id,
            })
        return 'ok'

    async def host_ip_delete(self, ip_id):
        sql = self.SQL_DELETE_HOST_IP

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'ip_id': ip_id,
            })
            self.wamp.publish('data.host_ip.change')
        return 'ok'

    async def host_mac_delete(self, mac_id):
        sql = self.SQL_DELETE_HOST_MAC

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'mac_id': mac_id,
            })
        return 'ok'

    async def host_delete(self, host_id):
        sql = self.SQL_DELETE_HOST

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'host_id': host_id,
            })
        return 'ok'

    async def group_delete(self, group_id):
        sql = self.SQL_DELETE_GROUP

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'group_id': group_id,
            })
        return 'ok'

    async def network_delete(self, network_id):
        sql = self.SQL_DELETE_NETWORK

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'network_id': network_id,
            })
        return 'ok'

    async def group_move(self, group_id, parent_id, **kwargs):
        sql = self.SQL_MOVE_GROUP

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'group_id': group_id,
                'parent_id': parent_id,
            })
        return 'ok'

    async def host_move(self, host_id, group_id, **kwargs):
        sql = self.SQL_MOVE_HOST

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'host_id': host_id,
                'group_id': group_id,
            })
        return 'ok'

    async def host_ip_get_icmp_status(self, addr):
        status = await self.wamp.call('icmp-poller.get_host_status', addr)

        return {
            'status': status
        }

    async def icmp_get_events_last(self):
        events = await self.wamp.call('icmp-poller.get_events_last')

        result = []
        ip_to_event = {}
        for event in events:
            event_time, event_source, event_from_state, event_to_state, event_extra = event
            host_id, network_id = event_extra
            e = {
                'time': event_time,
                'time_str': datetime.fromtimestamp(event_time).strftime('%Y-%m-%d %H:%M:%S'),
                'addr': event_source,
                'from': event_from_state,
                'to': event_to_state,
                'host_id': host_id,
                'network_id': network_id,
                'sub': []
            }
            try:
                ip_to_event[event_source]['sub'].append(e)
            except KeyError:
                ip_to_event[event_source] = e
                result.append(e)

        return {
            'events': result
        }

    async def search(self, q):
        result = []
        _q = '%'+q+'%'

        with (await self.db.cursor()) as cur:
            if re.match('([0-9]+\.)|(\.[0-9]+)', q):
                # looks like part of ip addr
                sql = 'SELECT ip_id, host_id, interface_name, network_id, addr FROM host_ip WHERE addr::text LIKE %(q)s ORDER BY addr'
                await cur.execute(sql, {'q': _q})
                for id, host_id, interface_name, network_id, addr in await cur.fetchall():
                    result.append({
                        'type': 'host_ip',
                        'ip_id': id,
                        'host_id': host_id,
                        'interface_name': interface_name,
                        'network_id': network_id,
                        'addr': addr,
                    })
            sql = 'SELECT host_id, name FROM host WHERE name ILIKE %(q)s ORDER BY name'
            await cur.execute(sql, {'q': _q})
            for host_id, name in await cur.fetchall():
                result.append({
                    'type': 'host',
                    'host_id': host_id,
                    'name': name,
                })
            sql = 'SELECT group_id, name FROM "group" WHERE name ILIKE %(q)s ORDER BY name'
            await cur.execute(sql, {'q': _q})
            for group_id, name in await cur.fetchall():
                result.append({
                    'type': 'group',
                    'group_id': group_id,
                    'name': name,
                })
        limit = 100
        end_marker = []
        if len(result) > limit:
            end_marker.append({
                'type': '_end_marker',
                'remaining_count': len(result) - limit
            })

        return result[:limit] + end_marker

    async def events_archive_get(self, start_time=None, end_time=None):
        sql = '''
            SELECT event_id, host_id, ip_id, service_type, severity, event_time, data
            FROM events_archive
        '''

        if start_time and end_time:
            sql += ' WHERE event_time >= to_timestamp(%(start_time)s) AND event_time <= to_timestamp(%(end_time)s)'

        sql += ' ORDER BY event_time DESC'

        result = []
        with (await self.db.cursor()) as cur:
            await cur.execute(sql, dict(start_time=int(start_time), end_time=int(end_time)))

            for event_id, host_id, ip_id, service_type, severity, event_time, data in await cur.fetchall():
                result.append({
                    'event_id': event_id,
                    'host_id': host_id,
                    'ip_id': ip_id,
                    'service_type': service_type,
                    'severity': severity,
                    'event_time': event_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'data': data,
                })
        return result

    async def events_problem_hosts_get(self):
        sql = '''
            SELECT ip.host_id,
                case icmp_status
                    when 1 then 'unknown'
                    when 2 then 'alive'
                    when 3 then 'unreachable'
                end as status,
                ip.ip_id,
                ip.interface_name,
                ip.network_id,
                ip.addr,
                last_change_time,
                cc.clients_count
            FROM host_ip_icmp_status ip_s
            JOIN host_ip ip ON ip.ip_id = ip_s.ip_id
            LEFT JOIN (
                SELECT host_id, COUNT(client_id) as clients_count
                FROM client_port_owner
                GROUP BY host_id
            ) cc ON cc.host_id = ip.host_id
            WHERE ip_s.icmp_status != 2
            ORDER BY last_change_time DESC
        '''
        result = []
        with (await self.db.cursor()) as cur:
            await cur.execute(sql)

            for host_id, status, ip_id, interface_name, network_id, addr, last_change_time, clients_count in await cur.fetchall():
                result.append({
                    'host_id': host_id,
                    'status': status,
                    'ip_id': ip_id,
                    'interface_name': interface_name,
                    'network_id': network_id,
                    'addr': addr,
                    'last_change_time': last_change_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'last_change_time_ts': last_change_time.timestamp(),
                    'clients_count': clients_count,
                })
        return result
