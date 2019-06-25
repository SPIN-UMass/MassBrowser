import { Crypto } from '@utils/crypto'
import { EventEmitter } from 'events'
import { debug, warn } from '@utils/log'
import config from '@utils/config'
import { UDPRelayConnectionError } from '@utils/errors'
import { pendMgr } from './PendingConnections'
import * as dgram from 'dgram'

export class UDPRelayConnection extends EventEmitter {
  constructor (relayIP, relayPort, desc) {
    super()

    this.id = ''
    this.relayip = relayIP
    this.relayport = relayPort
    this.desc = desc
    this.hasSessionID = true
    this.sessionID = ''
    this.initialBuffer = null
    this.cipher = null
    this.socket = null
  }

  connect () {
    return new Promise((resolve, reject) => {
      let socket = dgram.createSocket('udp4')
      socket.bind({
        port: 10000 + Math.floor(Math.random() * (65535 - 10000))
      }, () => {
        debug('udp socket created')
      })
      //
      // this.socket.connect(this.port, this.server, () => {
      //   this.socket.send(new Buffer('TEST'), (err) => {
      //     debug('error on sending test message', err)
      //     this.socket.close()
      //   })
      //   resolve()
      // })
      this.socket.connect(this.relayport, this.relayip)

      const onFail = (err) => {
        warn(`Relay ${this.id} UDP connection error: ${err.message}`)
        reject(new UDPRelayConnectionError(err))
      }

      const onSuccess = () => {
        debug(`Relay ${this.id} UDP connected`)
        // Remove connection failure callback so it isn't called
        // in case of a later error in the connection
        // socket.removeListener('error', onFail)
        resolve(socket)
      }

      /* socket.setTimeout(config.relayConnectionTimeout, () => {
       socket.end()
       onFail(new Error('Connection Timeout'))
       }) */

      socket.once('connect', onSuccess)
      socket.once('error', onFail)
    })
      .then((socket) => this._initSocket(socket))
      .then((socket) => this._initRelay(socket))
  }

  sessionFounded (session) {
    this.desc = session.desc
    this.relayip = session.ip
    this.relayport = session.port
    return new Promise((resolve, reject) => {
      this._initSocket(this.socket)
      this._initRelay(this.socket)
      resolve()
    })
  }

  _initSocket (socket) {
    let desc = this.desc
    let cipher = new Crypto(desc['readkey'], desc['readiv'], desc['writekey'], desc['writeiv'], (d) => {
      this.emit('data', d)
    }, () => {
      this.emit('close')
      this.socket.close()
    })

    this.socket = socket
    this.cipher = cipher
    socket.on('data', (data) => {
      this.cipher.decrypt(data)
    })

    socket.on('error', (err) => {
      console.log('socket error', err)
      if (!socket.writable) {
        console.log('socket is not writable')
        this.emit('close')
      }
    })
    socket.on('end', () => {
      console.log('ending relay socket')
      this.emit('close')
    })
    return socket
  }

  _initRelay (socket) {
    let i = Math.random() * (100 - 1) + 1
    let padarr = [Buffer(this.desc['token'])]
    while (i > 0) {
      padarr.push(this.cipher.encryptzero())
      i = i - 1
    }
    socket.write(Buffer.concat(padarr))
    return socket
  }

  relayReverse (socket) {
    this.hasSessionID = false
    this.socket = socket

    const readable = (data) => {
      let sessionId = data.toString()
      console.log('read session id', sessionId, sessionId.length)
      this.hasSessionID = true
      this.sessionID = sessionId
      this.socket.removeListener('data', readable)
      pendMgr.setPendingConnection(this.sessionID, this)
    }
    this.socket.on('data', readable)
  }

  end () {
    this.socket.close()
  }

  write (conid, command, data) {
    let sendpacket = Buffer(7)
    sendpacket.writeUInt16BE(conid)
    sendpacket.write(command, 2)
    sendpacket.writeUInt32BE(data.length, 3)
    const b = Buffer.concat([sendpacket, data])
    const enc = this.cipher.encrypt(b)
    this.emit('send', enc)
    this.socket.write(enc)
  }
}

export default UDPRelayConnection
