/**
 * Created by milad on 4/12/17.
 */
import {policy} from './Policer'
const net = require('net')

import {Crypto} from '../crypt/crypto'

import {pendMgr} from './PendingConnections'

export class ConnectionReceiver {
  constructor (socketup,socketdown) {
    this.socketup = socketup
    this.socketdown = socketdown
    this.socketup.on('data', (data) => {
      // console.log('DATA RECIEVED', data);
      if (this.isAuthenticated) {
        this.crypt.decrypt(data)
      } else {
        this.authenticate(data)
      }
    })
    this.crypt = false
    this.isAuthenticated = false
    this.carrylen = 0
    this.carry = ''
    this.lastcommand = ''
    this.lastconid = ''
    this.lastsize = 0
    this.headersize = 32

    this.newconnectioncarry = Buffer(0)

    this.initcarry = ''
    this.connections = {}
  }

  authenticate (data) {
    // data = Buffer.concat([this.newconcarry, data]);
    // console.log("MY DATA", data);
    if (data.length >= this.headersize) {
      const sessiontoken = data.slice( 0, this.headersize)
      const desc = pendMgr.getPendingConnection(sessiontoken)
      console.log('Conid', sessiontoken)
      if (desc) {
        console.log('clientID', sessiontoken)
        this.crypt = new Crypto(desc['readkey'], desc['readiv'], desc['writekey'], desc['writeiv'], (d) => {
          this.onData(d)
        }, () => {
          console.log("I am here 3")
          this.socket.end()
        })
        console.log("I am here")
        this.crypt.decrypt(data.slice(this.headersize, data.length))
        console.log("I am here 2")
        this.isAuthenticated = true
        console.log('Authenticated')
      } else {
        console.log("I am here 4")
        this.socket.end()
      }
    }
  }

  write (conid, command, data) {
    let sendpacket = Buffer(7)
    sendpacket.writeUInt16BE(conid)
    sendpacket.write(command, 2)
    sendpacket.writeUInt32BE(data.length, 3)
    const b = Buffer.concat([sendpacket, data])
    this.socketdown.write(this.crypt.encrypt(b))
  }

  newConnection (ip, port, conid) {
    try {
      if (policy.checkDestination(ip, port)) {
        console.log("ip",ip,"port",port);
        this.connections[conid] = net.connect({host:ip ,port:port}, () => {
          this.write(conid, 'N', Buffer(ip + ':' + String(port)))

        })
        this.connections[conid].on('data', (data) => {
          this.write(conid, 'D', data)
        })
        this.connections[conid].on('end', () => {
          this.write(conid, 'C', Buffer(ip + ':' + String(port)))
          delete this.connections[conid]
        })
        this.connections[conid].on('error', () => {
          this.write(conid, 'C', Buffer(ip + ':' + String(port)))
          delete this.connections[conid]
        })
      }
    } catch (err) {
      this.write(conid, 'C', Buffer(ip + ':' + String(port)))
      console.log(err)
    }
  }

  commandParser (lastconid, CMD, size, data) {
    if (CMD === 'N') {
      data = String(data)
      if (data.length === size) {
        console.log("new con",data)
        const sp = data.split(':')

        const ip = sp[0]
        const port = sp[1]
        console.log('CREATE CONNECTION', ip, port)
        this.newconcarry = ''
        this.newConnection(ip, port, lastconid)
      } else {
        this.newconcarry += data
        if (this.newconcarry.length === size) {
          const sp = this.newconcarry.split(':')
          const ip = sp[0]
          const port = sp[1]
          console.log('CREATE CONNECTION', ip, port)
          this.newConnection(ip, port, lastconid)
        }
      }
    }
    if (CMD === 'D') {
      if (lastconid in this.connections) {
        this.connections[lastconid].write(data)
      }
    }
    if (CMD === 'C') {
      this.connections[lastconid].end()
    }
  }

  onData (data) {
    while (data) {
      if (this.carrylen > 0) {
        if (data.length <= this.carrylen) {
          this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data)
          this.carrylen -= data.length

          break
        } else {
          this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data.slice(0, this.carrylen))

          data = data.slice(this.carrylen)

          this.carrylen = 0
        }
      } else {
        if (this.carry.length > 0) {
          data = Buffer(this.carry + data.toString())
          this.carry = ''
        }
        if (data.length < 7) {
          this.carry = String(data)
        } else {
          this.lastconid = data.readUInt16BE(0)
          this.lastcommand = data.toString('ascii', 2, 3)

          this.carrylen = data.readUInt32BE(3)
          this.lastsize = this.carrylen

          if ((data.length - 7) <= this.carrylen) {
            this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data.slice(7))
            this.carrylen -= (data.length - 7)

            break
          } else {
            this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data.slice(7, this.carrylen + 7))
            data = data.slice(this.carrylen + 7)
            this.carrylen = 0
          }
        }
      }
    }
  }
}
