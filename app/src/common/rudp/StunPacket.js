const ip = require('ip');

// StunPacket Class
function StunPacket(stun_class, method, attrs) {
    this.class  = stun_class;
    this.method = method;
    this.attrs  = attrs || {};
    this.tid    = this._getTransactionId();
};

module.exports = StunPacket;

// StunPacket header length
StunPacket.HEADER_LENGTH = 20;
// STUN magic cookie
StunPacket.MAGIC_COOKIE = 0x2112A442;
// Max transaction ID (32bit)
StunPacket.TID_MAX = Math.pow(2,32);

// Binding Class
StunPacket.BINDING_CLASS  = 0x0001;
// STUN Method Mask
StunPacket.METHOD_MASK = 0x0110;
// STUN Method
StunPacket.METHOD = {
    REQUEST:    0x0000,
    INDICATION: 0x0010,
    RESPONSE_S: 0x0100,
    RESPONSE_E: 0x0110
};

// Attributes
StunPacket.ATTR = {
    MAPPED_ADDRESS:     0x0001,
    USERNAME:           0x0006,
    MESSAGE_INTEGRITY:  0x0008,
    ERROR_CODE:         0x0009,
    UNKNOWN_ATTRIBUTES: 0x000A,
    REALM:              0x0014,
    NONCE:              0x0015,
    XOR_MAPPED_ADDRESS: 0x0020,
    SOFTWARE:           0x8022,
    ALTERNATE_SERVER:   0x8023,
    FINGERPRINT:        0x8028
};

// Error code
StunPacket.ERROR_CODE = {
    300: 'Try Alternate',
    400: 'Bad Request',
    401: 'Unauthorized',
    420: 'Unknown Attribute',
    438: 'Stale Nonce',
    500: 'Server Error'
};

// Generate tansaction ID
StunPacket.prototype._getTransactionId = function _getTransactionId() {
    return Math.floor(Math.random() * StunPacket.TID_MAX);
};

// Encode StunPacket
StunPacket.prototype.encode = function encode() {
    var encoded_attrs = this._encodeAttributes();
    var encoded_header = this._encodeHeader(encoded_attrs.length);
    return Buffer.concat([encoded_header, encoded_attrs]);
};

// Encode StunPacket header
StunPacket.prototype._encodeHeader = function _encodeHeader(length) {
    var type = this.method | this.class;
    var encoded_header = new Buffer.alloc(StunPacket.HEADER_LENGTH);

    encoded_header.writeUInt16BE((type & 0x3fff), 0);
    encoded_header.writeUInt16BE(length, 2);
    encoded_header.writeUInt32BE(StunPacket.MAGIC_COOKIE, 4);
    encoded_header.writeUInt32BE(0, 8);
    encoded_header.writeUInt32BE(0, 12);
    encoded_header.writeUInt32BE(this.tid, 16);
    return encoded_header;
};

// Encode StunPacket attributes
StunPacket.prototype._encodeAttributes = function _encodeAttributes() {
    var encoded_attrs = new Buffer.alloc(0);

    // TODO: Not implemented yet

    return encoded_attrs;
};

// Determines whether STUN StunPacket
StunPacket.isStunPacket = function _isStunStunPacket(buffer) {
    let block1 = buffer.readUInt32BE(0)
    let block2 = buffer.readUInt32BE(4)
    return (block1 === 0x0101000c && block2 === 0x2112a442  && buffer.length === 32) ? true : false;
    // var block = buffer.readUInt8(0);
    // var bit1 = block & 0x80;
    // var bit2 = block & 0x40;

    // return (bit1 === 0 && bit2 === 0) ? true : false;
};

// Decode StunPacket
StunPacket.decode = function decode(buffer) {
    var buffer_header = buffer.slice(0, this.HEADER_LENGTH);
    var header = this._decodeHeader(buffer_header);

    var buffer_attrs = buffer.slice(this.HEADER_LENGTH, buffer.length);
    var attrs = this._decodeAttributes(buffer_attrs, buffer_header);

    var sp = new StunPacket(this.BINDING_CLASS, header.method, attrs);
    sp.tid = header.tid;

    return sp;
};

// Decode StunPacket header
StunPacket._decodeHeader = function _decodeHeader(buffer) {
    var header = {};
    header.method = buffer.readUInt16BE(0) & StunPacket.METHOD_MASK;
    header.length = buffer.readUInt16BE(2);
    header.magic_cookie = buffer.readUInt32BE(4);
    header.tid = buffer.readUInt32BE(16);
    return header;
};

// Decode StunPacket attributes
StunPacket._decodeAttributes = function _decodeAttributes(buffer, buffer_header) {
    var attrs = {};
    var offset = 0;

    while (offset < buffer.length) {
        var type = buffer.readUInt16BE(offset);
        offset += 2;

        var length = buffer.readUInt16BE(offset);
        var block_out = length % 4;
        if (block_out > 0) {
            length += 4 - block_out;
        }
        offset += 2;

        var value = buffer.slice(offset, offset + length);
        offset += length;

        switch (type) {
        case StunPacket.ATTR.MAPPED_ADDRESS:
            value = this._decodeMappedAddress(value);
            break;
        case StunPacket.ATTR.XOR_MAPPED_ADDRESS:
            value = this._decodeXorMappedAddress(value, buffer_header);
            break;
        case StunPacket.ATTR_ERROR_CODE:
            value = this._decodeErrorCode(value);
            break;
        case StunPacket.UNKNOWN_ATTRIBUTES:
            value = this._decodeUnknownAttributes(value);
            break;
        }

        attrs[type] = value;
    }

    return attrs;
};

// Decode MAPPED-ADDRESS value
StunPacket._decodeMappedAddress = function _decodeMappedAddress(buffer) {
    var family = (buffer.readUInt16BE(0) === 0x02) ? 6 : 4;

    return {
        family:  family,
        port:    buffer.readUInt16BE(2),
        address: ip.toString(buffer, 4, family)
    };
};


// Decode XOR-MAPPED-ADDRESS value
// See https://tools.ietf.org/html/rfc5389#section-15.2
StunPacket._decodeXorMappedAddress = function _decodeXorMappedAddress(buffer, buffer_header) {
    var family = (buffer.readUInt16BE(0) === 0x02) ? 6 : 4;

    var magic = buffer_header.slice(4, 8);  // BE
    var tid = buffer_header.slice(8, 20); // BE

    var xport = buffer.slice(2, 4);                     // LE
    var xaddr = buffer.slice(4, family === 4 ? 8 : 20); // LE

    var port = this._xor(xport, magic.slice(0, 2));
    var addr = this._xor(xaddr, family === 4 ? magic : Buffer.concat([magic, tid]))

    return {
        family:  family,
        port:    port.readUInt16BE(0),
        address: ip.toString(addr, 0, family)
    };
}

//// Decode XOR-MAPPED-ADDRESS value
//StunPacket._decodeXorMappedAddress = function _decodeMappedAddress(buffer, buffer_header) {
//    var family = (buffer.readUInt16BE(0) === 0x02) ? 6 : 4;
//
//    var xport = buffer.slice(2, 4);
//    var xaddr = buffer.slice(4);
//
//    var xorAddrBuf = buffer.slice(4, family === 4 ? 8 : 20);
//
//    var port = this._xor(xport, new Buffer(StunPacket.MAGIC_COOKIE).slice(0, 2));
//    var addr;
//    if (family === 4) {
//      addr = this._xor(xaddr, new Buffer(StunPacket.MAGIC_COOKIE));
//    } else {
//      var magic_buffer = new Buffer(StunPacket.MAGIC_COOKIE);
//      var tid_buffer = new Buffer([tid]);
//      addr = this._xor(xaddr, Buffer.concat([magic_buffer, tid_buffer]));
//    }
//
//    return {
//        family:  family,
//        port:    port,
//        address: addr
//    };
//};

// Decode ERROR-CODE value
StunPacket._decodeErrorCode = function _decodeErrorCode(buffer) {
    var block = buffer.readUInt32BE(0);
    var code = (block & 0x700) * 100 + block & 0xff;
    var reason = buffer.readUInt32BE(4);

    return {
        code: code,
        reason: reason
    };
};

// Decode UNKNOWN-ATTRIBUTES value
StunPacket._decodeUnknownAttributes = function _decodeUnknownAttributes(buffer) {
    var unknown_attrs = [];
    var offset = 0;

    while (offset < buffer.length) {
        unknown_attrs.push(buffer.readUInt16BE(offset));
        offset += 2;
    }

    return unknown_attrs;
};

StunPacket._xor = function _xor(a, b) {
    var data = [];

    if (b.length > a.length) {
      var tmp = a;
      a = b;
      b = tmp;
    }

    for (var i=0, len=a.length; i<len; i++) {
      data.push(a[i] ^ b[i]);
    }

    return new Buffer.from(data);
};