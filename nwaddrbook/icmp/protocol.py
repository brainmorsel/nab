import socket
import struct
from collections import namedtuple


def checksum(msg):
    # Internet Checksum: http://tools.ietf.org/html/rfc1071
    def carry_around_add(a, b):
        c = a + b
        return (c & 0xffff) + (c >> 16)

    s = 0
    for i in range(0, len(msg), 2):
        w = msg[i] + (msg[i+1] << 8)
        s = carry_around_add(s, w)
    return socket.htons(~s & 0xffff)


class Sequence:
    def __init__(self, init=0):
        self._sequence = init

    def next(self):
        seq = self._sequence
        self._sequence = (self._sequence + 1) & 0xffff
        return seq


class Request:
    def __init__(self, target, sequence, timestamp, retry=0):
        self.target = target
        self.sequence = sequence
        self.timestamp = timestamp
        self.retry = retry


class PacketBuilder:
    ICMP_ECHOREPLY = 0  # Echo reply (per RFC792)
    ICMP_ECHO = 8  # Echo request (per RFC792)

    def __init__(self, own_id, pad_data_size=0):
        self.own_id = own_id

        self.icmp_packet = namedtuple(
            'icmp_packet', 'type code checksum id sequence sender_id timestamp pad_data')

        self.struct = struct.Struct('!BBHHHHd{}s'.format(pad_data_size))
        startVal = 0x42
        self.pad_data = bytes(
            [(i & 0xff) for i in range(startVal, startVal + pad_data_size)])

    def build(self, sender_id, sequence, timestamp):
        def pack(csum=0):
            return bytearray(self.struct.pack(
                self.ICMP_ECHO, 0, csum,
                self.own_id,
                sequence,
                sender_id,
                timestamp,
                self.pad_data
            ))
        return pack(checksum(pack()))

    def parse(self, data):
        # integrity check
        if len(data) == self.struct.size and checksum(data) == 0:
            pkt = self.icmp_packet._make(self.struct.unpack(data))
            if (pkt.type == self.ICMP_ECHOREPLY and pkt.id == self.own_id):
                return pkt
