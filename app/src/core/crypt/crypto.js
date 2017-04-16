/**
 * Created by milad on 4/15/17.
 */
const crypto = require('crypto');
const alg = 'aes-256-gcm';
export class Crypto {
  constructor(readkey, readiv, writekey, writeiv, onData, onError) {
    console.log('readkey', readkey, 'readiv', readiv);
    console.log('writekey', writekey, 'writeiv', writeiv);
    this.cipher = crypto.createCipheriv(alg, readkey, readiv);
    this.decipher = crypto.createDecipheriv(alg, writekey, writeiv);
    this.onData = onData;
    this.onError = onError;
    this.datacarry=Buffer(0);
    this.decipher.on('readable', () => {


      var data = this.decipher.read();
      console.log('datatoread', data.length);
      if (this.datacarry) {
        data = Buffer.concat([this.datacarry, data]);
        this.datacarry = Buffer(0);
      }
      while (data.length > 31) {
        let padsize = data.readUInt8(31);

        if (padsize > 32) {
          this.onError();
          return;
        }
        if (padsize > 0) {
          if (data.readIntLE(31 - padsize, padsize) !== 0) {
            this.onError();
            return;
          }
        }
        if (padsize < 31) {
          this.onData(data.slice(0, 31 - padsize));
        }
        data = data.slice(32);
      }
      if (data.length > 0) {
        this.datacarry = data;

      }

    });
  }

  encrypt(buffer) {
    var reading = buffer;

    var decs = [];
    while (reading.length > 0) {
      const data = reading.slice(0, 31);
      const pad = Buffer.alloc(32 - data.length);
      pad.writeUInt8(31 - data.length, 31 - data.length);

      decs.push(this.cipher.update(Buffer.concat([data, pad])));
      reading = reading.slice(31, reading.length);
    }

    const crypted = Buffer.concat(decs);
    return crypted;
  }

  encryptzero() {

    const decs = [];

    const pad = Buffer.alloc(32);
    pad.writeUInt8(31, 31);

    decs.push(this.cipher.update(pad));


    const crypted = Buffer.concat(decs);
    return crypted;
  }

  decrypt(buffer) {
    this.decipher.write(buffer);
  }

}
