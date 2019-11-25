const Sender = require('./Sender');
const Receiver = require('./Receiver');
const constants = require('./constants');
const helpers = require('./helpers');
const Duplex = require('stream').Duplex;
const util = require('util');

module.exports = Connection;
function Connection(packetSender) {
	this._currentTCPState = constants.TCPStates.LISTEN;
	this._sender = new Sender(this, packetSender);
	this._receiver = new Receiver(this, packetSender);


	this._initialSequenceNumber = helpers.generateRandomNumber(constants.INITIAL_MAX_WINDOW_SIZE, constants.MAX_SEQUENCE_NUMBER);
	this._nextSequenceNumber = 0;
	this._nextExpectedSequenceNumber = 0;

	Duplex.call(this);
	var self = this;
	this._sender.on('syn_ack_acked', () => {
		this._changeCurrentTCPState(constants.TCPStates.ESTABLISHED)
		this.emit('connect')
	});
	this._sender.on('syn_acked', () => {
		this._changeCurrentTCPState(constants.TCPStates.ESTABLISHED)
		this._sender.send()
		this.emit('connect')
	});
	this._sender.on('fin_acked', () => {
		if (this._currentTCPState === constants.TCPStates.LAST_ACK) {
			this._changeCurrentTCPState(constants.TCPStates.CLOSED);
			this.emit('close');
		} else if (this._currentTCPState === constants.TCPStates.FIN_WAIT_1){
			this._changeCurrentTCPState(constants.TCPStates.FIN_WAIT_2);
		}
	});
	this._sender.on('max_number_of_tries_reached', () => {
		console.log('maximum number of tries reached')
	})
	this._receiver.on('send_ack', () => {
		this._sender.sendAck();
	})
	this._receiver.on('data', function (data) {
		self.emit('data', data)
	});
	this.on('close', () => {
		console.log('im closed')
		this._sender.close();
		this._receiver.close();
	});
};

util.inherits(Connection, Duplex);

Connection.prototype.getInitialSequenceNumber = function () {
	return this._initialSequenceNumber;
};

Connection.prototype.getNextExpectedSequenceNumber = function () {
	return this._nextExpectedSequenceNumber;
};

Connection.prototype.getNextSequenceNumber = function () {
	return this._nextSequenceNumber;
};

Connection.prototype._setNextSequenceNumber = function (sequenceNumber) {
	this._nextSequenceNumber = sequenceNumber;
}

Connection.prototype._setNextExpectedSequenceNumber = function (sequenceNumber) {
	this._nextExpectedSequenceNumber = sequenceNumber;
}

Connection.prototype.incrementNextSequenceNumber = function () {
	this._nextSequenceNumber = (this._nextSequenceNumber + 1) % constants.MAX_SEQUENCE_NUMBER;
};

Connection.prototype.incrementNextExpectedSequenceNumber = function () {
	this._nextExpectedSequenceNumber = (this._nextExpectedSequenceNumber + 1) % constants.MAX_SEQUENCE_NUMBER;
}

Connection.prototype.send = function (data) {
	this._sender.addDataToQueue(data)
	switch(this._currentTCPState) {
		case constants.TCPStates.LISTEN:
			this._sender.sendSyn();
			this._setNextSequenceNumber(this.getInitialSequenceNumber() + 1);
			this._changeCurrentTCPState(constants.TCPStates.SYN_SENT)
			break;
		case constants.TCPStates.ESTABLISHED:
			this._sender.send();
			break;
	}
};

Connection.prototype.receive = function (packet) {
	// console.log('got:', packet)
	switch(this._currentTCPState) {
		case constants.TCPStates.LISTEN:
			if (packet.getPacketType() === constants.PacketTypes.SYN) {
				this._setNextExpectedSequenceNumber(packet.getSequenceNumber() + 1);
				this._setNextSequenceNumber(this.getInitialSequenceNumber() + 1);
				this._sender.sendSynAck();
				this._changeCurrentTCPState(constants.TCPStates.SYN_RCVD)
			}
			break;
		case constants.TCPStates.SYN_SENT:
			if (packet.getPacketType() === constants.PacketTypes.SYN_ACK) {
				this._setNextExpectedSequenceNumber(packet.getSequenceNumber() + 1);
				this._sender.sendAck();
				this._sender.verifyAck(packet.getAcknowledgementNumber())
			}
			break;
		case constants.TCPStates.SYN_RCVD:
			if (packet.getPacketType() === constants.PacketTypes.ACK) {
				this._sender.verifyAck(packet.getAcknowledgementNumber())
			}
			break;
		case constants.TCPStates.ESTABLISHED:
			switch(packet.getPacketType()) {
				case constants.PacketTypes.ACK:
					this._sender.verifyAck(packet.getAcknowledgementNumber())
					break;
				case constants.PacketTypes.FIN:
					this._sender.sendAck();
					this._changeCurrentTCPState(constants.TCPStates.CLOSE_WAIT);
					this._sender.sendFin();
					this._changeCurrentTCPState(constants.TCPStates.LAST_ACK);
					break;
				case constants.PacketTypes.DATA:
					this._receiver.receive(packet);
					break;
			}
			break;
		case constants.TCPStates.LAST_ACK:
			if (packet.getPacketType() === constants.PacketTypes.ACK) {
				this._sender.verifyAck(packet.getAcknowledgementNumber());
			}
			break;
		case constants.TCPStates.FIN_WAIT_1:
			if (packet.getPacketType() === constants.PacketTypes.ACK) {
				this._sender.verifyAck(packet.getAcknowledgementNumber());
			}
			break;
		case constants.TCPStates.FIN_WAIT_2:
			if (packet.getPacketType() === constants.PacketTypes.FIN) {
				this._sender.sendAck();
				this._changeCurrentTCPState(constants.TCPStates.TIME_WAIT)
				setTimeout(() => {
					this._changeCurrentTCPState(constants.TCPStates.CLOSED)
					this.emit('close')
				}, constants.CLOSE_WAIT_TIME);
			}
			break;
		case constants.TCPStates.TIME_WAIT:
			if (packet.getPacketType() === constants.PacketTypes.FIN) {
				this._sender.sendAck()
			}
			break;
	}
};

Connection.prototype._changeCurrentTCPState = function (newState) {
	console.log(helpers.getKeyByValue(constants.TCPStates, this._currentTCPState), '->', helpers.getKeyByValue(constants.TCPStates, newState))
	this._currentTCPState = newState;
}

Connection.prototype.close = function () {
	this._sender.sendFin()
	this._changeCurrentTCPState(constants.TCPStates.FIN_WAIT_1)
}

Connection.prototype._write = function (chunk, encoding, callback) {
	this.send(chunk)
	callback()
}

Connection.prototype._read = function (n) {

}

Connection.prototype._final = function (callback) {
	callback()
}