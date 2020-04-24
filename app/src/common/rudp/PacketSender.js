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
  this._socket.on('close', () => {
    this._closed = true;
  })
};

PacketSender.prototype.send = function (packet) {
  let buffer = packet.toBuffer();
  if (this._sessionKey) {
    buffer = this._encrypt(packet.toBuffer())
  }

  if (!this._closed) {
    this._socket.send(buffer, 0, buffer.length, this._port, this._address);
  }
};

PacketSender.prototype._encrypt = function (buffer) {
  const iv = crypto.randomBytes(16);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this._sessionKey), iv);
  let encrypted = cipher.update(buffer);
  encrypted = Buffer.concat([iv, encrypted, cipher.final()]);
  return encrypted;
}

