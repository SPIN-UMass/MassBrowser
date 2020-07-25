const Sender = require('./Sender');
const Receiver = require('./Receiver');
const Packet = require('./Packet');
const StunPacket = require('./StunPacket');
const constants = require('./constants');
const helpers = require('./helpers');
const Duplex = require('stream').Duplex;
const util = require('util');
import { debug } from '@utils/log'
const crypto = require('crypto');
import {Semaphore} from 'await-semaphore'

module.exports = Connection;
function Connection(packetSender) {
  this.stunMode = false;
  this.currentTCPState = constants.TCPStates.LISTEN;
  this._packetSender = packetSender;
  this._sender = new Sender(this, packetSender);
  this._receiver = new Receiver(this, packetSender);
  this.initialSequenceNumber = helpers.generateRandomNumber(constants.INITIAL_MAX_WINDOW_SIZE, constants.MAX_SEQUENCE_NUMBER);
  this.nextSequenceNumber = 0;
  this.nextExpectedSequenceNumber = 0;
  this._connectionTimeoutTimer = null;
  this._sequenceNumberLock = new Semaphore(1);
  this._expectedSequenceNumberLock = new Semaphore(1);
  this._receiverLock = new Semaphore(1);
  this._sendLock = new Semaphore(1);
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
      this._stopTimeoutTimer();
      this._changeCurrentTCPState(constants.TCPStates.CLOSED);
      this._sender.clear();
      this._receiver.clear();
      this._sender._stopTimeoutTimer();
      this._packetSender.clear();
      this.emit('close');
    } else if (this.currentTCPState === constants.TCPStates.FIN_WAIT_1){
      this._changeCurrentTCPState(constants.TCPStates.FIN_WAIT_2);
    }
  });
  this._sender.on('timeout', () => {
    this._changeCurrentTCPState(constants.TCPStates.CLOSED);
    this._sender.clear();
    this._receiver.clear();
    this._stopTimeoutTimer();
    this._packetSender.clear();
    this.emit('close');
    this.emit('connection_timeout');
    debug('RUDP: maximum number of tries reached')
  })
  this._receiver.on('send_ack', () => {
    this._sender.sendAck();
  })
  this._sender.once('done', () => {
    this.emit('done');
  })

  this._restartTimeoutTimer();
};

util.inherits(Connection, Duplex);

Connection.prototype.setStunMode = function () {
  this.stunMode = true;
  this._stopTimeoutTimer();
}

Connection.prototype.receiveStunPacket = function (buffer) {
  if (!this.stunMode) {
    this.setStunMode()
  }
  let sp = StunPacket.decode(buffer)
  let res = sp.attrs[StunPacket.ATTR.XOR_MAPPED_ADDRESS]
  this.emit('stun-data', sp.tid, res);
}

Connection.prototype.sendStunRequest = function () {
  let sp = new StunPacket(StunPacket.BINDING_CLASS, StunPacket.METHOD.REQUEST, {});
  let message = sp.encode();
  this._packetSender.sendBuffer(message);
  return sp.tid;
}

Connection.prototype._stopTimeoutTimer = function () {
  clearTimeout(this._connectionTimeoutTimer);
  this._connectionTimeoutTimer = null;
}

Connection.prototype._startTimeoutTimer = function () {
  this._connectionTimeoutTimer = setTimeout(() => {
    this._cleanClose();
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

Connection.prototype._setNextSequenceNumber = async  function (sequenceNumber) {
  let release = await this._sequenceNumberLock.acquire()

  this.nextSequenceNumber = sequenceNumber;
  release()
}

Connection.prototype._setNextExpectedSequenceNumber =  async function (sequenceNumber) {
  let release = await this._expectedSequenceNumberLock.acquire()

  this.nextExpectedSequenceNumber = sequenceNumber;
  release()
}

Connection.prototype.incrementNextSequenceNumber = async function () {
  let release = await this._sequenceNumberLock.acquire()
  this.nextSequenceNumber = (this.nextSequenceNumber + 1) % constants.MAX_SEQUENCE_NUMBER;
  release()
};

Connection.prototype.incrementNextExpectedSequenceNumber = async function () {
  let release = await this._expectedSequenceNumberLock.acquire()

  this.nextExpectedSequenceNumber = (this.nextExpectedSequenceNumber + 1) % constants.MAX_SEQUENCE_NUMBER;
  release()
}

Connection.prototype._cleanClose = function() {
  this._changeCurrentTCPState(constants.TCPStates.CLOSED);
  this._sender._stopTimeoutTimer();
  this._sender.clear();
  this._packetSender.clear();
  this._receiver.clear();
  this._stopTimeoutTimer();
  this.emit('close');
}

Connection.prototype._decrypt = function(encryptedPacketWithIV) {
  try {
    let iv = encryptedPacketWithIV.slice(0,16);
    let key = this._packetSender._sessionKey.slice(0,32);
    let encryptedPacket = encryptedPacketWithIV.slice(16);
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedPacket);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
  } catch (err) {
    debug('RUDP ERROR IN DECRYPT! REMOVING CONNECTION')
    this._cleanClose();
  }
};

Connection.prototype.send = async function (data) {
  if (this.currentTCPState === constants.TCPStates.CLOSED) {
    debug('CONNECTION IS CLOSED SEND IGNORED')
    return
  }
  let release = await this._sendLock.acquire();
  await this._sender.addDataToQueue(data)
  
  switch(this.currentTCPState) {
    case constants.TCPStates.LISTEN:
      await this._sender.sendSyn();
      await this._setNextSequenceNumber(this.getInitialSequenceNumber() + 1);
      this._changeCurrentTCPState(constants.TCPStates.SYN_SENT)
      break;
    case constants.TCPStates.ESTABLISHED:
      this._sender.send();
      break;
  }
  release()

};

Connection.prototype.receive = async function (buffer) {
    let release = await this._receiverLock.acquire()
    let packet = new Packet(buffer)
    if (this._packetSender._sessionKey) {
      packet = new Packet(this._decrypt(buffer))
    }
    if (this.currentTCPState === constants.TCPStates.CLOSED) {
      debug('CONNECTION IS CLOSED RECEIVE IGNORED')
      release();
      return
    }
    this._restartTimeoutTimer();
    switch(this.currentTCPState) {
      case constants.TCPStates.LISTEN:
        if (packet.packetType === constants.PacketTypes.SYN) {
          await this._setNextExpectedSequenceNumber(packet.sequenceNumber + 1);
          await this._setNextSequenceNumber(this.getInitialSequenceNumber() + 1);
          await this._sender.sendSynAck();
          this._changeCurrentTCPState(constants.TCPStates.SYN_RCVD)
        }
        break;
      case constants.TCPStates.SYN_SENT:
        if (packet.packetType === constants.PacketTypes.SYN_ACK) {
          await this._setNextExpectedSequenceNumber(packet.sequenceNumber + 1);
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
            await this.incrementNextExpectedSequenceNumber();
            this._sender.clear();
            this._receiver.clear();
            this._sender.sendAck();
            this._changeCurrentTCPState(constants.TCPStates.CLOSE_WAIT);
            await this._sender.sendFin();
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
          await this.incrementNextExpectedSequenceNumber();
          this._sender.sendAck();
          this._changeCurrentTCPState(constants.TCPStates.TIME_WAIT)
          setTimeout(() => {
            this._changeCurrentTCPState(constants.TCPStates.CLOSED);
            this._sender._stopTimeoutTimer();
            this._stopTimeoutTimer();
            this._sender.clear();
            this._receiver.clear();
            this._packetSender.clear();
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

    release();
  
};

Connection.prototype._changeCurrentTCPState = function (newState) {
  debug('RUDP:', helpers.getKeyByValue(constants.TCPStates, this.currentTCPState), '->', helpers.getKeyByValue(constants.TCPStates, newState), this._packetSender.getAddressKey())
  this.currentTCPState = newState;
}

Connection.prototype.close = async function () {
  if (this.stunMode) {
    this._sender.clear();
    this._packetSender.clear();
    this._receiver.clear();
    this.emit('close');
    return;
  }
  switch(this.currentTCPState) {
    case constants.TCPStates.LISTEN:
    case constants.TCPStates.SYN_SENT:
    case constants.TCPStates.SYN_RCVD:
    case constants.TCPStates.ESTABLISHED:
      this._sender.clear();
      this._receiver.clear();
      await this._sender.sendFin();
      this._changeCurrentTCPState(constants.TCPStates.FIN_WAIT_1)
      break;
  }
}

Connection.prototype._write = async function (chunk, encoding, callback) {
    this.send(chunk).then(()=>{callback();});
}

Connection.prototype._read = function (n) {

}

Connection.prototype._final = function (callback) {
  this.close()
  // callback()
}
