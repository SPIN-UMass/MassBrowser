const crypto = require('crypto');

module.exports = PacketSender;
function PacketSender(socket, address, port, sessionKey) {
  if (!socket || !address || !port) {
    throw new Error('Expecting a socket, address, and a port.');
  }
  this._sessionKey = sessionKey
  this._socket = socket;
  this._address = address;
  this._port = port;
  this._closed = false;
  this._socket.on('close', this._closePacketSender)
};

PacketSender.prototype.getAddressKey = function () {
  try {
      return this._address + ':' + this._port + this._socket.address().port
  } catch (err) {
    console.log('Error in getAddressKey in PacketSender', err)
  }
}

PacketSender.prototype._closePacketSender = function () {
  this._closed = true;
}

PacketSender.prototype.clear = function () {
  try {
    this._closed = true;
    if (this._socket) {
      this._socket.removeListener('close', this._closePacketSender)
    }
  } catch (err) {
    console.log('Error in clear in PacketSender', err)
  }
}

PacketSender.prototype.sendBuffer = function (buffer) {
  try {
      if (!this._closed) {
      this._socket.send(buffer, 0, buffer.length, this._port, this._address);
    }
  } catch (err) {
    console.log('Error in sendBuffer in PacketSender', err)
  }
}

PacketSender.prototype.send = function (packet) {
  try {
    let buffer = packet.toBuffer();
    if (this._sessionKey) {
      buffer = this._encrypt(packet.toBuffer())
    }

    if (!this._closed) {
      this._socket.send(buffer, 0, buffer.length, this._port, this._address);
    }
  } catch (err) {
    console.log('Error in send in PacketSender', err)
  }
};

PacketSender.prototype._encrypt = function (buffer) {
  const iv = crypto.randomBytes(16);
  let key = Buffer.from(this._sessionKey.slice(0,32))
  let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(buffer);
  encrypted = Buffer.concat([iv, encrypted, cipher.final()]);
  return encrypted;
}

