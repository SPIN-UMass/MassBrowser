var Sender = require('./Sender');
var Receiver = require('./Receiver');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Duplex = require('stream').Duplex;

// TODO: have connections refuse packets when closed.

module.exports = Connection;
function Connection(packetSender) {
  Duplex.call(this, packetSender);
  this._sender = new Sender(packetSender);
  this._receiver = new Receiver(packetSender);

  var self = this;
  this._receiver.on('data', function (data) {
    self.emit('data', data)
  });
};

// util.inherits(Connection, EventEmitter);
util.inherits(Connection, Duplex);

Connection.prototype._write = function (chunk, encoding, callback) {

}

Connection.prototype._read = function () {

}

Connection.prototype._final = function () {
  this.push(null);
}

Connection.prototype.send = function (data) {
  this._sender.send(data);
};

Connection.prototype.receive = function (packet) {
  if (packet.getIsAcknowledgement()) {
    this._sender.verifyAcknowledgement(packet.getSequenceNumber());
  } else {
    this._receiver.receive(packet);
  }
};
