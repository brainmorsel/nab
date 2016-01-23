from datetime import datetime

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
        except Exception as error:
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
        SELECT h.host_id, h.group_id, h.name, h.host_type_id, h.snmp_community_public, h.snmp_community_private, h.data
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
            data=%(data)s
        WHERE host_id = %(host_id)s
    '''

    SQL_MOVE_HOST = '''
        UPDATE host SET
            group_id=%(group_id)s
        WHERE host_id = %(host_id)s
    '''

    SQL_CREATE_HOST = '''
        INSERT INTO host (group_id, host_type_id, name, snmp_community_public, snmp_community_private, data)
        VALUES (%(group_id)s, %(host_type_id)s, %(name)s, %(snmp_community_public)s, %(snmp_community_private)s, %(data)s)
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
                for id, group_id, name, type_id, snmp_public, snmp_private, data in await cur.fetchall():
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
            sql = self.SQL_GET_HOST_IP + ' WHERE ip.host_id = %(id)s'

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

    async def group_get(self, group_id):
        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_GROUP + ' WHERE g.group_id = %(id)s'
            await cur.execute(sql, dict(id=group_id))
            id, parent_id, name, type_id, type_name, icon_name = await cur.fetchone()
            return {'group': {
                'type': 'group',
                'group_id': id,
                'parent_id': parent_id,
                'name': name,
                'group_type_id': type_id,
                'group_type_name': type_name,
                'icon_name': icon_name
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

    async def group_save(self, name, group_type_id, group_id=None, parent_id=None):
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

    async def host_get(self, host_id):
        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_HOST + ' WHERE h.host_id = %(id)s'
            await cur.execute(sql, dict(id=host_id))
            id, group_id, name, host_type_id, snmp_community_public, snmp_community_private, data = await cur.fetchone()
            return {'host': {
                'type': 'host',
                'host_id': id,
                'group_id': group_id,
                'name': name,
                'host_type_id': host_type_id,
                'snmp_community_public': snmp_community_public,
                'snmp_community_private': snmp_community_private,
                'data': data,
            }}

    async def host_get_batch(self, ids):
        with (await self.db.cursor()) as cur:
            sql = self.SQL_GET_HOST + ' WHERE h.host_id in %(ids)s'
            hosts = []
            group_ids = set()

            await cur.execute(sql, dict(ids=tuple(ids)))
            for id, group_id, name, host_type_id, snmp_community_public, snmp_community_private, data in await cur.fetchall():
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

    async def host_save(self, name, host_type_id, snmp_community_public, snmp_community_private, data, host_id=None, group_id=None):
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

    async def host_ip_save(self, addr, network_id, host_id, interface_name=None, ip_id=None):
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
            self.wamp.publish('data.host_ip.change')

        return 'ok'

    async def host_mac_save(self, addr, host_id, interface_name=None, mac_id=None):
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

    async def group_move(self, group_id, parent_id):
        sql = self.SQL_MOVE_GROUP

        with (await self.db.cursor()) as cur:
            await cur.execute(sql, {
                'group_id': group_id,
                'parent_id': parent_id,
            })
        return 'ok'

    async def host_move(self, host_id, group_id):
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
