var constants = require('./constants');
var Packet = require('./Packet');
var Lock = require('./Lock');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = Receiver;
function Receiver(connection) {
  this._connection = connection;
  this._packets = {};
  this._lock = new Lock();
}
util.inherits(Receiver, EventEmitter);

Receiver.prototype.clear = function () {
  this._packets = {};
}

Receiver.prototype.receive = async function (packet) {
  await this._lock.acquire();
  if (packet.sequenceNumber >= this._connection.nextExpectedSequenceNumber) {
    this._packets[packet.sequenceNumber] = packet;
    let index = packet.sequenceNumber;
    while (!!this._packets[index] && index === this._connection.nextExpectedSequenceNumber) {
      this.emit('data', this._packets[index].payload);
      this._connection.incrementNextExpectedSequenceNumber();
      this.emit('send_ack')
      index = this._connection.nextExpectedSequenceNumber;
    }
  }
  this._lock.release();
}
