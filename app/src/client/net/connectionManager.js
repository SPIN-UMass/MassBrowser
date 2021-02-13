import crypto from 'crypto'
import * as errors from '@utils/errors'
import { debug } from '@utils/log'
import { connectionStats } from '@/services'
import {Semaphore} from 'await-semaphore'

class ConnectionManager {
  constructor () {
    this.relayAssigner = null
    this.conid_IP_PORT = {}
    this.clientConnections = {}
    this.connectionMaps = {}
    this.carrylen = 0
    this.carry = ''
    this.lastcommand = ''
    this.lastconid = ''
    this.lastsize = 0
    this.newconcarry = ''
  }

  setRelayAssigner (relayAssigner) {
    this.relayAssigner = relayAssigner
  }

  newConnection (ip, port, conid) {
    this.clientConnections[conid].relayConnected()
  }

  commandParser (lastconid, CMD, size, data) {
    if (CMD === 'N') {
      data = String(data)
      if (data.length === size) {
        const sp = data.split(':')
        const ip = sp[0]
        const port = sp[1]
        
        // console.log('CREATE CONNECTION', ip, port)
        this.newconcarry = ''
        this.newConnection(ip, port, lastconid)
      } else {
        this.newconcarry += data
        if (this.newconcarry.length === size) {
          const sp = this.newconcarry.split(':')
          const ip = sp[0]
          const port = sp[1]
          this.newconcarry = ''
          // console.log('CREATE CONNECTION', ip, port)
          this.newConnection(ip, port, lastconid)
        }
      }
    }
    if (CMD === 'D') {
      //console.log(this.ClientConnections);
      if (lastconid in this.clientConnections) {
        this.clientConnections[lastconid].write(data)
      }
    }
    if (CMD === 'C') {
      this.cleanClose(lastconid)
    }
  }

  cleanClose (conid) {
    this.clientConnections[conid].end()
    // delete this.ClientConnections[conid]
  }

  listener (data) {
    // console.log('DATA RECEIVED', data);
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
        if (this.carry) {
          data = Buffer.from(this.carry + data)
        }
        if (data.length < 7) {
          this.carry = data
        }

        this.lastconid = data.readUInt16BE(0)
        this.lastcommand = data.toString('ascii', 2, 3)

        this.carrylen = data.readUInt32BE(3)
        this.lastsize = this.carrylen

        // console.log(data, String(data), this.lastconid, this.lastsize, this.lastcommand);

        if ((data.length - 7) <= this.carrylen) {
          this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data.slice(7))
          this.carrylen -= (data.length - 7)
          break
        } else {
          this.commandParser(this.lastconid, this.lastcommand, this.lastsize, data.slice(7, this.carrylen + 7))
          this.carrylen -= 0
          data = data.slice(this.carrylen + 7)
        }
      }
    }
  }

  connectionClose (socket) {
//    console.log('closed')
  }

  onRelayClose (relay) {
    Object.keys(this.connectionMaps).forEach((key) => {
      if (this.connectionMaps[key] === relay) {
        // console.log('closing connection')
        this.clientConnections[key].end()
      }
    })
  }

  async writer (data, conid) {
    // console.log('DATA SEND', data, conid);
    await this.connectionMaps[conid].write(conid, 'D', data)
  }

  newClientConnection (connection, dstip, dstport, onConnect) {
    var conid = crypto.randomBytes(2).readUInt16BE()
    if (!this.relayAssigner) {
      throw new errors.AppError('No Relay Assigner has been set for the ConnectionManager')
    }
    this.conid_IP_PORT[conid] = dstip
    this.clientConnections[conid] = connection
    this.clientConnections[conid].relayConnected = () => { onConnect() }

    return new Promise((resolve, reject) => {
      this.relayAssigner.assignRelay(dstip, dstport)
        .then(relay => {
          debug(`Relay [${relay.id}] assigned for connection`)
          this.connectionMaps[conid] = relay
          connection.relay = relay
          let cr = String(dstip) + ':' + String(dstport)
          this.connectionMaps[conid].write(conid, 'N', Buffer.from(cr))
          connection.on('data', (data) => {
            if (typeof data === "string")
            {
              data = Buffer.from(data)
            }
            

            this.writer(data, conid)
          })

          connection.on('close', () => {
            this.connectionMaps[conid].write(conid, 'C', Buffer.alloc(0))
            connection.end()
          })
          connection.on('error', (err) => {
            this.connectionMaps[conid].write(conid, 'C', Buffer.alloc(0))
          })
          connectionStats.connectionRelayAssigned(connection, relay)
          resolve('Assigned')
        })
        .catch(err => reject(err))
        // TODO: //   delete this.ClientConnections[conid]

        // , (err) => {
        //   delete this.ClientConnections[conid]
        //   reject('Don\'t Proxy')
        // })
    })
  }

  testConnect (dstip, dstport, relay, onConnect, onDisconnect) {
    var conid = crypto.randomBytes(2).readUInt16BE()
    debug(`new remote connection (${conid}, ${dstip}, ${dstport})`)
    this.clientConnections[conid] = {}
    this.clientConnections[conid].relayConnected = () => { onConnect() }
    this.clientConnections[conid].end = () => { onDisconnect() }
    return new Promise((resolve, reject) => {
      debug(`Relay ${relay.id} assigned for connection`)
      this.connectionMaps[conid] = relay
      var cr = String(dstip) + ':' + String(dstport)
      // console.log('sendsize:', cr.length, cr)
      this.connectionMaps[conid].write(conid, 'N', Buffer.from(cr))

      resolve('Assigned')
    })
  }
}

export const connectionManager = new ConnectionManager()
export default connectionManager
