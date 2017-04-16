/**
 * Created by milad on 4/11/17.
 */
const net = require('net');
import {Crypto} from '../crypt/crypto';

export class RelayConnection {
  constructor(relayip, relayport, relaycert, onWritecallback, onEndcallback, desc) {
    const self = this;
    this.relayip = relayip;
    this.relayport = relayport;
    this.relaycert = relaycert;
    this.onWrite = onWritecallback;
    this.onEnd = onEndcallback;
    this.cipher = new Crypto(desc['readkey'], desc['readiv'], desc['writekey'], desc['writeiv'], (d) => {
      this.onWrite(d);
    }, () => {
      this.socket.end();
    });

    this.socket = net.connect(this.relayport, this.relayip, () => {
      console.log(this.relayip, this.relayport, 'SENDING DATA');

      var i = Math.random() * (100 - 1) + 1;
      var padarr = [Buffer(desc['clientid'])];
      while (i > 0) {
        padarr.push(this.cipher.encryptzero());
        i -= 1;
      }

      console.log('I am sending',(Buffer.concat(padarr)));

      self.socket.write(Buffer.concat(padarr));

    });
    this.socket.on('data', (data) => {
      this.cipher.decrypt(data);
    });
  }

  write(conid, command, data) {

    let sendpacket = Buffer(7);
    sendpacket.writeUInt16BE(conid);
    sendpacket.write(command, 2);
    sendpacket.writeUInt32BE(data.length, 3);
    const b = Buffer.concat([sendpacket, data]);
    console.log("writing to the relay", b);
    const enc=this.cipher.encrypt(b);
    console.log("writing to the relay enc", enc);
    this.socket.write(enc);
  }
}

