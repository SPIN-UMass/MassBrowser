var constants = require('./constants');
var Packet = require('./Packet');
var Lock = require('./Lock');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
import {Semaphore} from 'await-semaphore'

module.exports = Receiver;
function Receiver(connection) {
  this._connection = connection;
  this._packets = {};
  this._lock = new Semaphore(1)
}
util.inherits(Receiver, EventEmitter);

Receiver.prototype.clear = function () {
  this._packets = {};
}

Receiver.prototype.receive = async function (packet) {

    let release = await this._lock.acquire()
    if (packet.sequenceNumber >= this._connection.nextExpectedSequenceNumber) {
      this._packets[packet.sequenceNumber] = packet;
      let index = packet.sequenceNumber;
      while (!!this._packets[index] && index === this._connection.nextExpectedSequenceNumber) {
        let  packet = this._packets[index].payload
        delete this._packets[index]
        this._connection.emit('data', packet);
        await this._connection.incrementNextExpectedSequenceNumber();
        this.emit('send_ack')
        index = this._connection.nextExpectedSequenceNumber;
      }
    }
    release()

}
