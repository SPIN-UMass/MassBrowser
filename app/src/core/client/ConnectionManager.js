/**
 * Created by milad on 4/12/17.
 */
import {RelayConnection} from './RelayConnection';
const jspack = require('jspack');
const crypto = require('crypto');

class ConnectionManager {
  constructor() {

    this.relayConnections = [];
    this.ClientConnections = {};
    this.Connectionmaps = {};
    this.carrylen = 0;
    this.carry = '';
    this.lastcommand = '';
    this.lastconid = '';
    this.lastsize = 0;
    this.newconcarry = '';

  }

  newConnection(ip, port, conid) {
    console.log("Connection Created");

  }

  commandParser(lastconid, CMD, size, data) {
    if (CMD === 'N') {
      data = String(data);
      if (data.length === size) {
        const sp = data.split(':');
        const ip = sp[0];
        const port = sp[1];
        console.log('CREATE CONNECTION', ip, port);
        this.newconcarry = '';
        this.newConnection(ip, port, lastconid);
      } else {
        this.newconcarry += data;
        if (this.newconcarry.length === size) {
          const sp = this.newconcarry.split(':');
          const ip = sp[0];
          const port = sp[1];
          console.log('CREATE CONNECTION', ip, port);
          this.newConnection(ip, port, lastconid);


        }
      }
    }
    if (CMD === 'D') {
      //console.log(this.ClientConnections);
      if (lastconid in this.ClientConnections) {
        //console.log("I AM HERE");
        this.ClientConnections[lastconid].write(data);
      }
    }
    if (CMD === 'C') {
      this.ClientConnections[lastconid].end();
    }
  }

  listener(data) {
    //console.log('DATA RECEIVED', data);
    while (data) {
      if (this.carrylen > 0) {
        if (data.length <= this.carrylen) {
          this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data);
          this.carrylen -= data.length;
          break;
        } else {
          this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data.slice(0, this.carrylen));

          data = data.slice(this.carrylen);
          this.carrylen = 0;
        }


      }
      else {
        if (this.carry) {
          data = Buffer(this.carry + data);
        }
        if (data.length < 7) {
          this.carry = data;
        }

        this.lastconid = data.readUInt16BE(0);
        this.lastcommand = data.toString('ascii', 2, 3);

        this.carrylen = data.readUInt32BE(3);
        this.lastsize = this.carrylen;

        console.log(data, String(data), this.lastconid, this.lastsize, this.lastcommand);


        if ((data.length - 7) <= this.carrylen) {
          this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data.slice(7));
          this.carrylen -= (data.length - 7);
          break;
        } else {
          this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data.slice(7, this.carrylen + 7));
          this.carrylen -= 0;
          data = data.slice(this.carrylen + 7);
        }


      }
    }

  }

  connectionClose(socket) {
    console.log('closed');

  }

  writer(data, conid) {
    console.log('DATA SEND', data, conid);
    this.Connectionmaps[conid].write(conid, 'D', data);
  }

  newRelayConnection(relayip, relayport, relaycert,desc) {
    try {
      var relay = new RelayConnection(relayip, relayport, relaycert, (data) => {
        this.listener(data);
      }, this.connection_close,desc);
      this.relayConnections.push(relay);
    }
    catch (err) {
      console.error('Error creating relay', err);
    }


  }

  assignRelay(ip,port) {
    return this.relayConnections[Math.floor(Math.random() * this.relayConnections.length)];

  }


  newClientConnection(connection, dstip, dstport) {
    var conid = crypto.randomBytes(2).readUInt16BE();

    console.log(conid, dstip, dstport);
    if (this.relayConnections.length === 0) {
      console.log("No Relay To connect!!!");
      throw "ERROR";
    }
    this.ClientConnections[conid] = connection;
    this.Connectionmaps[conid] = this.assignRelay(dstip,dstport);
    var cr = String(dstip) + ':' + String(dstport);
    console.log('sendsize:', cr.length);
    this.Connectionmaps[conid].write(conid, 'N', Buffer(cr));
    connection.on('data', (data) => {
      this.writer(data, conid);

    });


  }

}


var ConMgr = new ConnectionManager();
module.exports = {Conmgr: ConMgr};
