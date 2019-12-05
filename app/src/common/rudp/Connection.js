const Sender = require('./Sender');
const Receiver = require('./Receiver');
const Lock = require('./Lock');
const constants = require('./constants');
const helpers = require('./helpers');
const Duplex = require('stream').Duplex;
const util = require('util');

module.exports = Connection;
function Connection(packetSender) {
  this.currentTCPState = constants.TCPStates.LISTEN;
  this._sender = new Sender(this, packetSender);
  this._sendLock = new Lock();
  this._receiveLock = new Lock();
  this._receiver = new Receiver(this, packetSender);
  this.initialSequenceNumber = helpers.generateRandomNumber(constants.INITIAL_MAX_WINDOW_SIZE, constants.MAX_SEQUENCE_NUMBER);
  this.nextSequenceNumber = 0;
  this.nextExpectedSequenceNumber = 0;
  this._connectionTimeoutTimer = null;

  Duplex.call(this);

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
    if (this.currentTCPState === constants.TCPStates.LAST_ACK) {
      this._changeCurrentTCPState(constants.TCPStates.CLOSED);
      this._sender._stopTimeoutTimer();
      this._stopTimeoutTimer();
      this.emit('close');
    } else if (this.currentTCPState === constants.TCPStates.FIN_WAIT_1){
      this._changeCurrentTCPState(constants.TCPStates.FIN_WAIT_2);
    }
  });
  this._sender.on('timeout', () => {
    console.log('maximum number of tries reached')
    this.emit('timeout')
  })
  this._receiver.on('send_ack', () => {
    this._sender.sendAck();
  })
  this._receiver.on('data', (data) => {
    this.emit('data', data)
  });
  this._sender.once('done', () => {
    this.emit('done');
  })
};

util.inherits(Connection, Duplex);

Connection.prototype._stopTimeoutTimer = function () {
  clearTimeout(this._connectionTimeoutTimer);
  this._connectionTimeoutTimer = null;
}

Connection.prototype._startTimeoutTimer = function () {
  this._connectionTimeoutTimer = setTimeout(() => {
    this._changeCurrentTCPState(constants.TCPStates.CLOSED);
    this._sender._stopTimeoutTimer();
    this._sender.clear();
    this._receiver.clear();
    this.emit('close');
    this.emit('connection_timeout');
  }, constants.CONNECTION_TIMEOUT_INTERVAL)
}

Connection.prototype._restartTimeoutTimer = function () {
  this._stopTimeoutTimer();
  this._startTimeoutTimer();
}

Connection.prototype.getInitialSequenceNumber = function () {
  return this.initialSequenceNumber;
};

Connection.prototype.getNextExpectedSequenceNumber = function () {
  return this.nextExpectedSequenceNumber;
};

Connection.prototype.getNextSequenceNumber = function () {
  return this.nextSequenceNumber;
};

Connection.prototype._setNextSequenceNumber = function (sequenceNumber) {
  this.nextSequenceNumber = sequenceNumber;
}

Connection.prototype._setNextExpectedSequenceNumber = function (sequenceNumber) {
  this.nextExpectedSequenceNumber = sequenceNumber;
}

Connection.prototype.incrementNextSequenceNumber = function () {
  this.nextSequenceNumber = (this.nextSequenceNumber + 1) % constants.MAX_SEQUENCE_NUMBER;
};

Connection.prototype.incrementNextExpectedSequenceNumber = function () {
  this.nextExpectedSequenceNumber = (this.nextExpectedSequenceNumber + 1) % constants.MAX_SEQUENCE_NUMBER;
}

Connection.prototype.send = function (data) {
  this._sender.addDataToQueue(data)
  switch(this.currentTCPState) {
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

Connection.prototype.receive = async function (packet) {
  await this._receiveLock.acquire();
  this._restartTimeoutTimer();
  switch(this.currentTCPState) {
    case constants.TCPStates.LISTEN:
      if (packet.packetType === constants.PacketTypes.SYN) {
        this._setNextExpectedSequenceNumber(packet.sequenceNumber + 1);
        this._setNextSequenceNumber(this.getInitialSequenceNumber() + 1);
        await this._sender.sendSynAck();
        this._changeCurrentTCPState(constants.TCPStates.SYN_RCVD)
      }
      break;
    case constants.TCPStates.SYN_SENT:
      if (packet.packetType === constants.PacketTypes.SYN_ACK) {
        this._setNextExpectedSequenceNumber(packet.sequenceNumber + 1);
        await this._sender.sendAck();
        await this._sender.verifyAck(packet.acknowledgementNumber)
      }
      break;
    case constants.TCPStates.SYN_RCVD:
      switch(packet.packetType) {
        case constants.PacketTypes.ACK:
          await this._sender.verifyAck(packet.acknowledgementNumber)
          break;
        case constants.PacketTypes.DATA:
          await this._sender.verifyAck(packet.acknowledgementNumber)
          await this._receiver.receive(packet)
          break;
      }
      break;
    case constants.TCPStates.ESTABLISHED:
      switch(packet.packetType) {
        case constants.PacketTypes.ACK:
          await this._sender.verifyAck(packet.acknowledgementNumber)
          break;
        case constants.PacketTypes.FIN:
          this.incrementNextExpectedSequenceNumber();
          this._sender.clear();
          this._receiver.clear();
          this._sender.sendAck();
          this._changeCurrentTCPState(constants.TCPStates.CLOSE_WAIT);
          this._sender.sendFin();
          this._changeCurrentTCPState(constants.TCPStates.LAST_ACK);
          break;
        case constants.PacketTypes.DATA:
          await this._receiver.receive(packet);
          break;
      }
      break;
    case constants.TCPStates.LAST_ACK:
      if (packet.packetType === constants.PacketTypes.ACK) {
        await this._sender.verifyAck(packet.acknowledgementNumber);
      }
      break;
    case constants.TCPStates.FIN_WAIT_1:
      if (packet.packetType === constants.PacketTypes.ACK) {
        await this._sender.verifyAck(packet.acknowledgementNumber);
      }
      break;
    case constants.TCPStates.FIN_WAIT_2:
      if (packet.packetType === constants.PacketTypes.FIN) {
        this.incrementNextExpectedSequenceNumber();
        this._sender.sendAck();
        this._changeCurrentTCPState(constants.TCPStates.TIME_WAIT)
        setTimeout(() => {
          this._changeCurrentTCPState(constants.TCPStates.CLOSED);
          this._sender._stopTimeoutTimer();
          this._stopTimeoutTimer();
          this.emit('close');
        }, constants.CLOSE_WAIT_TIME);
      }
      break;
    case constants.TCPStates.TIME_WAIT:
      if (packet.packetType === constants.PacketTypes.FIN) {
        this._sender.sendAck()
      }
      break;
  }
  this._receiveLock.release();
};

Connection.prototype._changeCurrentTCPState = function (newState) {
  console.log(helpers.getKeyByValue(constants.TCPStates, this.currentTCPState), '->', helpers.getKeyByValue(constants.TCPStates, newState))
  this.currentTCPState = newState;
}

Connection.prototype.close = async function () {
  switch(this.currentTCPState) {
    case constants.LISTEN:
    case constants.SYN_SENT:
    case constants.SYN_RCVD:
    case constants.TCPStates.ESTABLISHED:
      this._sender.clear();
      this._receiver.clear();
      await this._sender.sendFin();
      this._changeCurrentTCPState(constants.TCPStates.FIN_WAIT_1)
      break;
  }
}

Connection.prototype._write = async function (chunk, encoding, callback) {
  await this._sendLock.acquire();
  this.send(chunk)
  callback()
  this._sendLock.release();
}

Connection.prototype._read = function (n) {

}

Connection.prototype._final = function (callback) {
  this.close()
  // callback()
}
