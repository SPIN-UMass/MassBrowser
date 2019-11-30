var LinkedList = require('./LinkedList');
var constants = require('./constants');
var Packet = require('./Packet');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = Receiver;
function Receiver(connection) {
	this._connection = connection;
	this._packets = new LinkedList(function (packetA, packetB) {
		return packetA.getSequenceNumber() - packetB.getSequenceNumber();
	});
}
util.inherits(Receiver, EventEmitter);


Receiver.prototype.clear = function () {
	this._packets.clear();
};

Receiver.prototype.receive = function (packet) {
	if (packet.getSequenceNumber() < this._connection.getNextExpectedSequenceNumber()) {
		this.emit('send_ack');
	} else if (packet.getSequenceNumber() >= this._connection.getNextExpectedSequenceNumber()) {
		let insertionResult = this._packets.insert(packet);
		if (insertionResult === LinkedList.InsertionResult.INSERTED) {
			this._pushIfExpectedSequence(packet);
		} else if (insertionResult === LinkedList.InsertionResult.EXISTS) {
			this.emit('send_ack')
		}
	}
};

Receiver.prototype._pushIfExpectedSequence = function (packet) {
	if (packet.getSequenceNumber() === this._connection.getNextExpectedSequenceNumber()) {
		this.emit('data', packet.getPayload());
		this._connection.incrementNextExpectedSequenceNumber();
		this.emit('send_ack')
		this._packets.shift();
		if (this._packets.currentNode() !== null) {
			this._pushIfExpectedSequence(this._packets.currentValue());
		}
	}
};