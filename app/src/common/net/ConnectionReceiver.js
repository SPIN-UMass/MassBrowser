/**
 * Created by milad on 4/12/17.
 */
import { policyManager } from '@/services'
const net = require('net')
import { error, debug } from '@utils/log'

import { Crypto } from '@utils/crypto'
import { HttpTransport } from '@utils/transport'

import API from '@/api'
import { Buffer } from 'buffer';
// import { pendMgr } from './PendingConnections'

// Used in TCPRelay etc.
export class ConnectionReceiver {
  constructor (socketup, socketdown, socket, authenticator, is_relay_client) {
    console.log("ConnectionReceiver constructor")
    this.authenticator = authenticator
    this.sessionId = null
    this.socketup = socketup
    this.socket = socket
    this.socketdown = socketdown

    // ensures that the correct API calls are used.
    if (is_relay_client) {
        this.is_relay_client = true
    } else {
        this.is_relay_client = false
    }
    // sadly, javascript seems to be incapable of passing references to functions
        // that belong to an object... So I cannot pass API.updateC2CSessionStatus etc.

    this.socketup.on('data', (data) => {
      if (this.isAuthenticated) {
        this.crypt.decrypt(data)
      } else {
        this.sessionId = this.authenticate(data)
      }
    })

    this.crypt = false
    this.isAuthenticated = false
    this.carrylen = 0
    this.carry = Buffer(0)
    this.lastcommand = ''
    this.newconcarry=''
    this.lastconid = ''
    this.lastsize = 0
    this.headersize = 32
    this.desciber = {}
    this.initcarry = ''
    this.connections = {} 
    
  }

  authenticate (data) {
    // data = Buffer.concat([this.newconcarry, data]);
    // console.log("MY DATA", data);
    if (data.length >= this.headersize) {
      const sessiontoken = data.slice(0, this.headersize)
      const desc = this.authenticator.authenticate(sessiontoken)
      if (desc) {
        if (this.is_relay_client) {
            API.updateC2CSessionStatus(desc.sessionId, 'used')
        } else {
            API.clientSessionConnected(desc.sessionId, 'used')
        }
        this.desciber = desc
        this.crypt = new Crypto(desc['readkey'], desc['readiv'], desc['writekey'], desc['writeiv'], (d) => {
          this.onData(d)
        }, () => {
          this.socket.end()
        })
        this.crypt.decrypt(data.slice(this.headersize, data.length))
        this.isAuthenticated = true

        return desc.sessionId
      } else {
        this.socket.end()
      }
    }
    return null
  }

  write (conid, command, data) {
    let sendpacket = Buffer(7)
    sendpacket.writeUInt16BE(conid)
    sendpacket.write(command, 2)
    sendpacket.writeUInt32BE(data.length, 3)
    if (command!=='D') {
      debug(`Sending Down [${command}] , [${data}] , [${data.length}]`)
    }
    const b = Buffer.concat([sendpacket, data])
    
    this.socketdown.write(this.crypt.encrypt(b))
      
    
  }

  newConnection (ip, port, conid) {
    policyManager.getDomainPolicy(ip, port).then(() => {
      try {
        debug(`New connection to [${ip}]:[${port}]`)
        this.connections[conid] = net.connect({host: ip, port: port}, () => {
          debug(`connected to [${ip}]`)
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
          debug(`error on [${ip}]`)
          this.write(conid, 'C', Buffer(ip + ':' + String(port)))
          delete this.connections[conid]
        })
      }
      catch (err) {
        this.write(conid, 'C', Buffer(ip + ':' + String(port)))
      }
    }).catch((err) => {
      this.write(conid, 'C', Buffer(ip + ':' + String(port)))
      debug(err)
    })
  }

  commandParser (lastconid, CMD, size, data) {

    if (CMD === 'N') {
      data=String(data)
      if (data.length === size) {
        const sp = data.split(':')

        const ip = sp[0]
        const port = sp[1]
        this.newconcarry = ''
        this.newConnection(ip, port, lastconid)
      } else {
        this.newconcarry += data
        if (this.newconcarry.length === size) {
          const sp = this.newconcarry.split(':')
          this.newconcarry=''
          const ip = sp[0]
          const port = sp[1]
          this.newConnection(ip, port, lastconid)
        }
      }
    } else if (CMD === 'D') {
      if (lastconid in this.connections) {
        this.connections[lastconid].write(data)
      }
    } else if (CMD === 'C') {
      if (lastconid in this.connections) {
        this.connections[lastconid].end()
      }
    } else if (CMD === 'K') {
    } else {
      if (lastconid in this.connections) {
        this.connections[lastconid].end()
      }
    }
  }

  closeConnections () {
    if (this.isAuthenticated) {
      if (this.is_relay_client) {
          API.updateC2CSessionStatus(this.desciber.sessionId, 'expired')
      } else {
          API.clientSessionDisconnected(this.desciber.sessionId, 'expired')
      }
    }

    Object.keys(this.connections).forEach((key) => {
      this.connections[key].end()
    })
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
          data = Buffer.concat([this.carry , data])
          this.carry = Buffer(0)
        }
        if (data.length < 7) {
          this.carry = data
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
