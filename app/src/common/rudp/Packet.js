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
    this.sequenceNumber = buffer.readUInt32BE(0);
    this.acknowledgementNumber = buffer.readUInt32BE(4);
    let options = buffer.readUInt32BE(8);
    switch (options) {
      case 1:
        this.packetType = constants.PacketTypes.FIN;
        break;
      case 2:
        this.packetType = constants.PacketTypes.SYN;
        break;
      case 4:
        this.packetType = constants.PacketTypes.RST;
        break;
      case 8:
        this.packetType = constants.PacketTypes.ACK;
        break;
      case 10:
        this.packetType = constants.PacketTypes.SYN_ACK;
        break;
      default:
        this.packetType = constants.PacketTypes.DATA;
    }
    this.payload = Buffer.alloc(buffer.length - 12);
    buffer.copy(this.payload, 0, 12);
  } else {
    this.sequenceNumber = sequenceNumber;
    this.acknowledgementNumber = acknowledgementNumber;
    this.packetType = packetType;
    this.payload = payload;
  }
};
util.inherits(Packet, EventEmitter);

Packet.prototype.acknowledge = function () {
  this.emit('acknowledge');
};

Packet.prototype.toBuffer = function() {
  let retval = Buffer.alloc(12 + this.payload.length);
  retval.writeUInt32BE(this.sequenceNumber, 0);
  retval.writeUInt32BE(this.acknowledgementNumber, 4);
  switch (this.packetType) {
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
  this.payload.copy(retval, 12, 0);
  return retval;
}

Packet.prototype.toObject = function () {
  let object = {
    sequenceNumber: this.sequenceNumber,
    acknowledgementNumber: this.acknowledgementNumber,
    packetType: this.packetType
  }
  return object;
}
