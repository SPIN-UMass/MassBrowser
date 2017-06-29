/**
 * Created by milad on 4/12/17.
 */
import crypto from 'crypto'
import Promise from 'bluebird'

import RelayConnection from './RelayConnection'
import * as errors from '~/utils/errors'
import { debug } from '~/utils/log'

class _ConnectionManager {
  constructor () {
    this.relayAssigner = null

    this.ClientConnections = {}
    this.Connectionmaps = {}
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
    this.ClientConnections[conid].relayConnected()
  }

  commandParser (lastconid, CMD, size, data) {
    if (CMD === 'N') {
      data = String(data)
      if (data.length === size) {
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
      // console.log(this.ClientConnections);
      if (lastconid in this.ClientConnections) {
        this.ClientConnections[lastconid].write(data)
      }
    }
    if (CMD === 'C') {
      this.cleanClose(lastconid)
    }
  }

  cleanClose (conid) {
    this.ClientConnections[conid].end()
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
          data = Buffer(this.carry + data)
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
    console.log('closed')
  }

  writer (data, conid) {
    // console.log('DATA SEND', data, conid);
    this.Connectionmaps[conid].write(conid, 'D', data)
  }

  newClientConnection (connection, dstip, dstport, onConnect) {
    var conid = crypto.randomBytes(2).readUInt16BE()

    debug(`new remote connection (${conid}, ${dstip}, ${dstport})`)

    if (!this.relayAssigner) {
      throw errors.AppError(new Error(), 'No Relay Assigner has been set for the ConnectionManager')
    }

    this.ClientConnections[conid] = connection
    this.ClientConnections[conid].relayConnected = () => { onConnect() }

    return new Promise((resolve, reject) => {
      this.relayAssigner.assignRelay(dstip, dstport)
        .then(relay => {
          debug(`Relay ${relay} assigned for connection`)
          this.Connectionmaps[conid] = relay
          var cr = String(dstip) + ':' + String(dstport)
          console.log('sendsize:', cr.length, cr)
          this.Connectionmaps[conid].write(conid, 'N', Buffer(cr))

          connection.on('data', (data) => {
            this.writer(data, conid)
          })

          connection.on('close', () => {
            this.Connectionmaps[conid].write(conid, 'C', Buffer(0))
          })
          connection.on('error', (err) => {
            this.Connectionmaps[conid].write(conid, 'C', Buffer(0))
          })
          resolve('Assigned')
        }, (err) => {
          delete this.ClientConnections[conid]
          reject('Don\'t Proxy')
        })
    })
  }

  testConnect (dstip, dstport, relay, onConnect,onDisconnect) {
    var conid = crypto.randomBytes(2).readUInt16BE()

    debug(`new remote connection (${conid}, ${dstip}, ${dstport})`)

    if (!this.relayAssigner) {
      throw errors.AppError(new Error(), 'No Relay Assigner has been set for the ConnectionManager')
    }

    this.ClientConnections[conid].relayConnected = () => { onConnect() }
    this.ClientConnections[conid].end = () => { onDisconnect() }

    return new Promise((resolve, reject) => {
      debug(`Relay ${relay} assigned for connection`)
      this.Connectionmaps[conid] = relay
      var cr = String(dstip) + ':' + String(dstport)
      console.log('sendsize:', cr.length, cr)
      this.Connectionmaps[conid].write(conid, 'N', Buffer(cr))

      resolve('Assigned')
    })
  }
}

var ConnectionManager = new _ConnectionManager()
// module.exports = {ConnectionManager: _ConMgr};
export default ConnectionManager
