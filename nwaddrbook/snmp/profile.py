from pysnmp.proto import rfc1902


class MIB_2:
    sysDescr = '1.3.6.1.2.1.1.1.0'
    sysObjectID = '1.3.6.1.2.1.1.2.0'  # OID
    sysUpTime = '1.3.6.1.2.1.1.3.0'  # TIMETICKS: 1 = 10ms
    sysContact = '1.3.6.1.2.1.1.4.0'  # rw
    sysName = '1.3.6.1.2.1.1.5.0'  # rw
    sysLocation = '1.3.6.1.2.1.1.6.0'  # rw
    sysServices = '1.3.6.1.2.1.1.7.0'
    # integer bitmask: layer functionality
    #   1 physical (e.g., repeaters)
    #   2 datalink/subnetwork (e.g., bridges)
    #   3 internet (e.g., IP gateways)
    #   4 end-to-end (e.g., IP hosts)
    #   7 applications (e.g., mail relays)

    ifNumber = '1.3.6.1.2.1.2.1.0'
    ifDescr = '1.3.6.1.2.1.2.2.1.2.{idx}'
    ifType = '1.3.6.1.2.1.2.2.1.3.{idx}'
    # ifType: ethernet-csmacd(6)
    ifMtu = '1.3.6.1.2.1.2.2.1.4.{idx}'
    ifSpeed = '1.3.6.1.2.1.2.2.1.5.{idx}'
    ifPhysAddress = '1.3.6.1.2.1.2.2.1.6.{idx}'
    ifAdminStatus = '1.3.6.1.2.1.2.2.1.7.{idx}'  # rw
    ifOperStatus = '1.3.6.1.2.1.2.2.1.8.{idx}'
    # status: up(1) down(2)
    ifLastChange = '1.3.6.1.2.1.2.2.1.9.{idx}'  # TIMETICKS
    ifInOctets = '1.3.6.1.2.1.2.2.1.10.{idx}'
    ifInUcastPkts = '1.3.6.1.2.1.2.2.1.11.{idx}'
    ifInNUcastPkts = '1.3.6.1.2.1.2.2.1.12.{idx}'
    ifInDiscards = '1.3.6.1.2.1.2.2.1.13.{idx}'
    ifInErrors = '1.3.6.1.2.1.2.2.1.14.{idx}'
    ifInUnknownProtos = '1.3.6.1.2.1.2.2.1.15.{idx}'
    ifOutOctets = '1.3.6.1.2.1.2.2.1.16.{idx}'
    ifOutUcastPkts = '1.3.6.1.2.1.2.2.1.17.{idx}'
    ifOutNUcastPkts = '1.3.6.1.2.1.2.2.1.18.{idx}'
    ifOutDiscards = '1.3.6.1.2.1.2.2.1.19.{idx}'
    ifOutErrors = '1.3.6.1.2.1.2.2.1.20.{idx}'
    ifOutQLen = '1.3.6.1.2.1.2.2.1.21.{idx}'


__oid_to_profile = {}


def profile_factory(device_oid, *args, **kwargs):
    profile_class = __oid_to_profile[device_oid]
    return profile_class(*args, **kwargs)


def register(device_oid):
    def _wrapper(profile_class):
        __oid_to_profile[device_oid] = profile_class
        return profile_class
    return _wrapper


class BaseProfile:
    def __init__(self, poller, addr, port=161, public='public', private='private'):
        self._p = poller
        self._addr = addr
        self._port = port
        self._r = public
        self._w = private


class DES3200_XX_C1(BaseProfile):
    VAL_active = rfc1902.Integer(1)
    VAL_notInService = rfc1902.Integer(2)
    VAL_notReady = rfc1902.Integer(3)
    VAL_createAndGo = rfc1902.Integer(4)
    VAL_createAndWait = rfc1902.Integer(5)
    VAL_destroy = rfc1902.Integer(6)

    async def config_save(self):
        oid = '1.3.6.1.4.1.171.12.1.2.18.4.0'
        return await self._p.request_set(self._addr, self._port, self._w, (
                (oid, self.VAL_createAndGo),
            ))

    OID_swMcastFilterPortGroupRowStatus = '1.3.6.1.4.1.171.12.53.3.1.3.{port}.{id}'
    async def mcast_profile_enable(self, port, profile_id):
        return await self._p.request_set(self._addr, self._port, self._w, (
            (self.OID_swMcastFilterPortGroupRowStatus.format(port=port, id=profile_id), self.VAL_createAndGo),
        ))

    async def mcast_profile_disable(self, port, profile_id):
        return await self._p.request_set(self._addr, self._port, self._w, (
            (self.OID_swMcastFilterPortGroupRowStatus.format(port=port, id=profile_id), self.VAL_destroy),
        ))

    async def mcast_profile_status(self, port, profile_id):
        res = await self._p.request_get(self._addr, self._port, self._r, (
            (self.OID_swMcastFilterPortGroupRowStatus.format(port=port, id=profile_id), None),
        ))
        if res['success']:
            bResult, = res['result']
            _, status = bResult
            res['result'] = status == self.VAL_active
        return res


@register('1.3.6.1.4.1.171.10.113.3.1')
class DES3200_18_C1(DES3200_XX_C1):
    pass


@register('1.3.6.1.4.1.171.10.113.4.1')
class DES3200_26_C1(DES3200_XX_C1):
    pass


@register('1.3.6.1.4.1.171.10.113.5.1')
class DES3200_28_C1(DES3200_XX_C1):
    pass


@register('1.3.6.1.4.1.171.10.113.9.1')
class DES3200_52_C1(DES3200_XX_C1):
    pass


class DES_Base(BaseProfile):
    VAL_create = rfc1902.Integer(2)
    VAL_destroy = rfc1902.Integer(3)

    async def config_save(self):
        oid = '1.3.6.1.4.1.171.12.1.2.6.0'
        val = rfc1902.Integer(5)
        return await self._p.request_set(self._addr, self._port, self._w, (
                (oid, val),
            ))

    OID_swL2McastFilterPortInfoProfileName = ''
    OID_swL2McastFilterPortProfileID = ''
    OID_swL2McastFilterPortProfileAddOrDelState = ''

    async def mcast_profile_status(self, port, profile_id):
        res = await self._p.request_get(self._addr, self._port, self._r, (
            (self.OID_swL2McastFilterPortInfoProfileName.format(port=port), None),
        ))
        if res['success']:
            bResult, = res['result']
            _, status = bResult
            ids = map(int, str(status).split('-'))
            res['result'] = profile_id in ids
        return res

    async def mcast_profile_enable(self, port, profile_id):
        # порядок биндов важен
        res = await self._p.request_set(self._addr, self._port, self._w, (
            (self.OID_swL2McastFilterPortProfileAddOrDelState.format(port=port), self.VAL_create),
            (self.OID_swL2McastFilterPortProfileID.format(port=port), rfc1902.Integer(profile_id)),
        ))
        return res

    async def mcast_profile_disable(self, port, profile_id):
        # порядок биндов важен
        res = await self._p.request_set(self._addr, self._port, self._w, (
            (self.OID_swL2McastFilterPortProfileAddOrDelState.format(port=port), self.VAL_destroy),
            (self.OID_swL2McastFilterPortProfileID.format(port=port), rfc1902.Integer(profile_id)),
        ))
        return res


@register('1.3.6.1.4.1.171.10.113.1.5')
class DES3200_26(DES_Base):
    OID_base = '1.3.6.1.4.1.171.11.113.1.5'
    OID_swL2McastFilterPortInfoProfileName = OID_base + '.2.22.5.1.2.{port}'
    OID_swL2McastFilterPortProfileID = OID_base + '.2.22.3.1.3.{port}'
    OID_swL2McastFilterPortProfileAddOrDelState = OID_base + '.2.22.3.1.2.{port}'


@register('1.3.6.1.4.1.171.10.113.1.3')
class DES3200_28(DES_Base):
    OID_base = '1.3.6.1.4.1.171.11.113.1.3'
    OID_swL2McastFilterPortInfoProfileName = OID_base + '.2.22.5.1.2.{port}'
    OID_swL2McastFilterPortProfileID = OID_base + '.2.22.3.1.3.{port}'
    OID_swL2McastFilterPortProfileAddOrDelState = OID_base + '.2.22.3.1.2.{port}'


@register('1.3.6.1.4.1.171.10.63.8')
class DES3052(DES_Base):
    OID_base = '1.3.6.1.4.1.171.11.63.8'
    OID_swL2McastFilterPortInfoProfileName = OID_base + '.2.22.5.1.2.{port}'
    OID_swL2McastFilterPortProfileID = OID_base + '.2.22.3.1.3.{port}'
    OID_swL2McastFilterPortProfileAddOrDelState = OID_base + '.2.22.3.1.2.{port}'


@register('1.3.6.1.4.1.171.10.63.6')
class DES3028(DES_Base):
    OID_base = '1.3.6.1.4.1.171.11.63.6'
    OID_swL2McastFilterPortInfoProfileName = OID_base + '.2.22.5.1.2.{port}'
    OID_swL2McastFilterPortProfileID = OID_base + '.2.22.3.1.3.{port}'
    OID_swL2McastFilterPortProfileAddOrDelState = OID_base + '.2.22.3.1.2.{port}'


@register('1.3.6.1.4.1.171.10.116.1')
class DES1228_ME_A1(DES_Base):
    OID_base = '1.3.6.1.4.1.171.11.116.1'
    OID_swL2McastFilterPortInfoProfileName = OID_base + '.2.22.5.1.2.{port}'
    OID_swL2McastFilterPortProfileID = OID_base + '.2.22.3.1.3.{port}'
    OID_swL2McastFilterPortProfileAddOrDelState = OID_base + '.2.22.3.1.2.{port}'


@register('1.3.6.1.4.1.171.10.116.2')
class DES1228_ME(DES_Base):
    OID_base = '1.3.6.1.4.1.171.11.116.2'
    OID_swL2McastFilterPortInfoProfileName = OID_base + '.2.22.5.1.2.{port}'
    OID_swL2McastFilterPortProfileID = OID_base + '.2.22.3.1.3.{port}'
    OID_swL2McastFilterPortProfileAddOrDelState = OID_base + '.2.22.3.1.2.{port}'
