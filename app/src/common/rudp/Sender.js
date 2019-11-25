var helpers = require('./helpers');
var constants = require('./constants');
var Packet = require('./Packet');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = Sender;
function Sender(connection, packetSender) {
	this._packetSender = packetSender;
	this._connection = connection;
	this._duplicateAckCount = 0;
	this._currentCongestionControlState = constants.CongestionControl.States.SLOW_START;
	this._timeoutTimer = null;
	this._timeoutInterval = constants.Retransmission.INITIAL_RETRANSMISSION_INTERVAL;
	this._estimatedRTT = 0;
	this._devRTT = 0;
	this._slowStartThreshold = constants.CongestionControl.INITIAL_SLOW_START_THRESHOLD;
	this._retransmissionQueue = [];
	this._sendingQueue = [];
	this._maxWindowSize = 1;
	this._delayedAckTimer = null;

	this._startTimeoutTimer();
}
util.inherits(Sender, EventEmitter);

Sender.prototype.close = function () {
	this._retransmissionQueue = [];
	this._sendingQueue = [];
	this._delayedAckTimer = null;
	this._timeoutTimer = null;
}

Sender.prototype.send = function () {
	this._sending = true;
	this._sendData()
}

Sender.prototype.addDataToQueue = function (data) {
	let chunks = helpers.splitArrayLike(data, constants.UDP_SAFE_SEGMENT_SIZE);
	this._sendingQueue = this._sendingQueue.concat(chunks);
}

Sender.prototype._stopTimeoutTimer = function () {
	clearTimeout(this._timeoutTimer);
	this._timeoutTimer = null;
}

Sender.prototype._startTimeoutTimer = function () {
	this._timeoutCount = 0;
	this._timeoutTimer = setTimeout(() => {
		this._timeout();
	}, this._timeoutInterval)
}

Sender.prototype.restartTimeoutTimer = function () {
	this._timeoutCount = 0;
	this._stopTimeoutTimer();
	this._startTimeoutTimer();
}

Sender.prototype._timeout = function () {
	switch(this._currentCongestionControlState) {
		case constants.CongestionControl.States.SLOW_START:
			this._slowStartThreshold = Math.floor(this._maxWindowSize / 2);
			this._maxWindowSize = 1;
			this._duplicateAckCount = 0;
			this._retransmit();
			break;
		case constants.CongestionControl.States.CONGESTION_AVOIDANCE:
		case constants.CongestionControl.States.FAST_RECOVERY:
			this._slowStartThreshold = Math.floor(this._maxWindowSize / 2);
			this._maxWindowSize = 1;
			this._duplicateAckCount = 0;
			this._retransmit();
			this._changeCurrentCongestionControlState(constants.CongestionControl.States.SLOW_START);
			break;
	}
	if (this._timeoutCount > constants.Retransmission.MAX_NUMBER_OF_RETRANSMISSION) {
		this._timeoutCount = 0;
		this._stopTimeoutTimer();
		this._sendingQueue = [];
		this._retransmissionQueue = [];
		this.emit('max_number_of_tries_reached');
	}
	if (this._retransmissionQueue.length !== 0) {
		this._timeoutCount += 1;
	}
	this._timeoutTimer = setTimeout(() => {
		this._timeout();
	}, this._timeoutInterval)
}

Sender.prototype._retransmit = function () {
	let packetsCount = Math.min(this._retransmissionQueue.length, Math.floor(this._maxWindowSize))
	for (let i = 0; i < packetsCount; i++) {
		let packetObject = this._retransmissionQueue[i];
		this._packetSender.send(packetObject.packet);
		packetObject.retransmitted = true;
	}
};

Sender.prototype._pushToRetransmissionQueue = function (packet) {
	let packetObject = {
		packet: packet,
		retransmitted: false,
		sentTime: process.hrtime(),
	}
	this._retransmissionQueue.push(packetObject)
};

Sender.prototype.sendSyn = function () {
	let synPacket = new Packet(this._connection.getInitialSequenceNumber(), this._connection.getNextExpectedSequenceNumber(), constants.PacketTypes.SYN, Buffer.alloc(0))
	synPacket.on('acknowledge', () => {
		this.emit('syn_acked');
	});
	this._packetSender.send(synPacket);
	this._retransmissionQueue = []
	this._pushToRetransmissionQueue(synPacket)
};

Sender.prototype.sendSynAck = function () {
	let synAckPacket = new Packet(this._connection.getInitialSequenceNumber(), this._connection.getNextExpectedSequenceNumber(), constants.PacketTypes.SYN_ACK, Buffer.alloc(0))
	synAckPacket.on('acknowledge', () => {
		this.emit('syn_ack_acked');
	});
	this._packetSender.send(synAckPacket)
	this._pushToRetransmissionQueue(synAckPacket)
};

Sender.prototype.sendAck = function (immediate = true) {
	if (immediate === true) {
		this._packetSender.send(new Packet(this._connection.getNextSequenceNumber(), this._connection.getNextExpectedSequenceNumber(), constants.PacketTypes.ACK, Buffer.alloc(0)))
	} else if (immediate === false && this._delayedAckTimer === null) {
		this._delayedAckTimer = setTimeout(()=> {
			this.sendAck();
			this._delayedAckTimer = null;
		}, constants.DELAYED_ACK_TIME)
	}
};

Sender.prototype._updateRTT = function (sampleRTT) {
	sampleRTT = sampleRTT[0] * 1000 + sampleRTT[1] / 1000000;
	this._estimatedRTT = (1 - constants.Retransmission.ALPHA) * this._estimatedRTT + constants.Retransmission.ALPHA * sampleRTT
	this._devRTT = (1 - constants.Retransmission.BETA) * this._devRTT + constants.Retransmission.BETA * Math.abs(sampleRTT - this._estimatedRTT);
	this._timeoutInterval = Math.floor(this._estimatedRTT + 4 * this._devRTT);
}

Sender.prototype.sendFin = function () {
	let finPacket = new Packet(this._connection.getNextSequenceNumber(), this._connection.getNextExpectedSequenceNumber(), constants.PacketTypes.FIN, Buffer.alloc(0))
	finPacket.on('acknowledge', () => {
		this.emit('fin_acked');
	});
	this._packetSender.send(finPacket)
	this._pushToRetransmissionQueue(finPacket)
}

Sender.prototype._windowHasSpace = function () {
	return this._retransmissionQueue.length < Math.floor(this._maxWindowSize);
}

Sender.prototype._sendData = function () {
	while (this._sendingQueue.length && this._windowHasSpace()) {
		let payload = this._sendingQueue.shift();
		let packet = new Packet(this._connection.getNextSequenceNumber(), this._connection.getNextExpectedSequenceNumber(), constants.PacketTypes.DATA, payload);
		this._connection.incrementNextSequenceNumber();
		this._packetSender.send(packet);
		this._pushToRetransmissionQueue(packet);
	}
};

Sender.prototype._printCongestionControlInfo = function () {
	// this function is for debug
	console.log('current state:',helpers.getKeyByValue(constants.CongestionControl.States, this._currentCongestionControlState))
	console.log('_maxWindowSize:', this._maxWindowSize)
	console.log('_duplicateAckCount:', this._duplicateAckCount)
	console.log('_slowStartThreshold:', this._slowStartThreshold)
	console.log('_timeoutCount:', this._timeoutCount)
	console.log('_retransmissionQueue.length:', this._retransmissionQueue.length)
}

Sender.prototype._changeCurrentCongestionControlState = function (newState) {
	// console.log(helpers.getKeyByValue(constants.CongestionControl.States, this._currentCongestionControlState), '->', helpers.getKeyByValue(constants.CongestionControl.States, newState))
	this._currentCongestionControlState = newState;
}

Sender.prototype.verifyAck = function (sequenceNumber) {
	if (this._retransmissionQueue.length && this._retransmissionQueue[0].packet.getSequenceNumber() < sequenceNumber) {
		switch(this._currentCongestionControlState) {
				case constants.CongestionControl.States.SLOW_START:
					this._maxWindowSize = this._maxWindowSize + 1;
					this._duplicateAckCount = 0;
					if (this._maxWindowSize >= this._slowStartThreshold) {
						this._changeCurrentCongestionControlState(constants.CongestionControl.States.CONGESTION_AVOIDANCE);
					}
					break;
				case constants.CongestionControl.States.CONGESTION_AVOIDANCE:
					this._duplicateAckCount = 0;
					this._maxWindowSize = this._maxWindowSize + 1/ Math.floor(this._maxWindowSize);
					break;
				case constants.CongestionControl.States.FAST_RECOVERY:
					this._maxWindowSize = this._slowStartThreshold;
					this._duplicateAckCount = 0;
					this._changeCurrentCongestionControlState(constants.CongestionControl.States.CONGESTION_AVOIDANCE);
					break;
		}
		this.restartTimeoutTimer();
		while (this._retransmissionQueue.length && this._retransmissionQueue[0].packet.getSequenceNumber() < sequenceNumber) {
			// this can be optimized
			let packetObject = this._retransmissionQueue.shift();
			packetObject.packet.acknowledge();
			if (packetObject.retransmitted === false) {
				let sampleRTT = process.hrtime(packetObject.sentTime)
				this._updateRTT(sampleRTT);
			}
		}
		this._sendData();
	} else if (this._retransmissionQueue.length && this._retransmissionQueue[0].packet.getSequenceNumber() === sequenceNumber){
		switch(this._currentCongestionControlState) {
			case constants.CongestionControl.States.SLOW_START:
			case constants.CongestionControl.States.CONGESTION_AVOIDANCE:
				this._duplicateAckCount += 1;
				break;
			case constants.CongestionControl.States.FAST_RECOVERY:
				this._maxWindowSize = this._maxWindowSize + 1;
				this._sendData();
				break;
		}
		if (this._duplicateAckCount === 3) {
			switch(this._currentCongestionControlState) {
				case constants.CongestionControl.States.SLOW_START:
				case constants.CongestionControl.States.CONGESTION_AVOIDANCE:
					this._slowStartThreshold = Math.floor(this._maxWindowSize / 2)
					this._maxWindowSize = this._slowStartThreshold + 3;
					this._retransmit();
					this._changeCurrentCongestionControlState(constants.CongestionControl.States.FAST_RECOVERY);	
					break;
			}				
		}
	} else {
		// we ignore acks if we dont have anything in _retransmissionQueue or sequenceNumber less than the smallest
	}
}