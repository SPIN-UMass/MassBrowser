var constants = require('./constants');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
//  0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |                        Sequence Number                        |
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |                    Acknowledgment Number                      |
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |                                                       |A|R|S|F|
// |                           Reserved                    |C|S|Y|I|
// |                                                       |K|T|N|N|
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |                             data                              |
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

module.exports = Packet;

function Packet(sequenceNumber, acknowledgementNumber, packetType, payload) {
    if (Buffer.isBuffer(sequenceNumber)) {
        let buffer = sequenceNumber;
        this._sequenceNumber = buffer.readUInt32BE(0);
        this._acknowledgementNumber = buffer.readUInt32BE(4);
        let options = buffer.readUInt32BE(8);
        switch (options) {
            case 1:
            this._packetType = constants.PacketTypes.FIN;
            break;
            case 2:
            this._packetType = constants.PacketTypes.SYN;
            break;
            case 4:
            this._packetType = constants.PacketTypes.RST;
            break;
            case 8:
            this._packetType = constants.PacketTypes.ACK;
            break;
            case 10:
            this._packetType = constants.PacketTypes.SYN_ACK;
            break;
            default:
            this._packetType = constants.PacketTypes.DATA;
        }
        this._payload = Buffer.alloc(buffer.length - 12);
        buffer.copy(this._payload, 0, 12);
    } else {
        this._sequenceNumber = sequenceNumber;
        this._acknowledgementNumber = acknowledgementNumber;
        this._packetType = packetType;
        this._payload = payload;
    }
};
util.inherits(Packet, EventEmitter);

Packet.prototype.getSequenceNumber = function() {
    return this._sequenceNumber;
};

Packet.prototype.getAcknowledgementNumber = function () {
    return this._acknowledgementNumber;
}

Packet.prototype.getPayload = function() {
    return this._payload;
};

Packet.prototype.getPacketType = function() {
    return this._packetType;
}

Packet.prototype.acknowledge = function () {
    this.emit('acknowledge');
};

Packet.prototype.toBuffer = function() {
    let retval = Buffer.alloc(12 + this._payload.length);
    retval.writeUInt32BE(this._sequenceNumber, 0);
    retval.writeUInt32BE(this._acknowledgementNumber, 4);
    switch (this._packetType) {
        case constants.PacketTypes.FIN:
        retval.writeUInt32BE(1, 8)
        break;            
        case constants.PacketTypes.SYN:
        retval.writeUInt32BE(2, 8)
        break;
        case constants.PacketTypes.RST:
        retval.writeUInt32BE(4, 8)
        break;
        case constants.PacketTypes.ACK:
        retval.writeUInt32BE(8, 8)
        break;
        case constants.PacketTypes.SYN_ACK:
        retval.writeUInt32BE(10, 8)
        break;
        case constants.PacketTypes.DATA:
        retval.writeUInt32BE(0, 8)
        break;        
        default:
        break;
    }
    this._payload.copy(retval, 12, 0);
    return retval;
}

Packet.prototype.toObject = function () {
    let object = {
        sequenceNumber: this._sequenceNumber,
        acknowledgementNumber: this._acknowledgementNumber,
        packetType: this._packetType
    }
    return object;
}