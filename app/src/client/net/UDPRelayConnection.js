import { Crypto } from '@utils/crypto'
import { EventEmitter } from 'events'
import { debug, warn } from '@utils/log'
import { UDPRelayConnectionError } from '@utils/errors'
import { pendMgr } from './PendingConnections'
import * as dgram from 'dgram'
import * as rudp from 'rudp'

export class UDPRelayConnection extends EventEmitter {
  constructor (relayIP, relayPort, desc) {
    super()
    this.id = ''
    this.relayIP = relayIP
    this.relayPort = relayPort
    this.desc = desc
    this.client = null
    this.hasSessionID = true
    this.sessionID = ''
    this.initialBuffer = null
    this.cipher = null
    this.socket = null
  }

  connect () {
    return new Promise((resolve, reject) => {
      let socket = dgram.createSocket('udp4')

      if (this.client === null) {
        this.client = new rudp.Client(socket, this.relayIP, this.relayPort)
      }

      socket.connect(this.relayPort, this.relayIP) // I'm not sure if this is necessary
      this.client.send(Buffer.from('TEST'))
      const onFail = (err) => {
        warn(`Relay ${this.id} UDP connection error: ${err.message}`)
        reject(new UDPRelayConnectionError(err))
      }

      const onSuccess = () => {
        debug(`Relay ${this.id} UDP connected`)
        socket.removeListener('error', onFail)
        resolve(socket)
      }

      socket.once('connect', onSuccess)
      socket.once('error', onFail)
      resolve()
    })
      .then((socket) => this._initSocket(socket))
      .then((socket) => this._initRelay(socket))
  }

  sessionFounded (session) {
    return new Promise((resolve, reject) => {
      this.desc = session.desc
      this.relayIP = session.ip
      this.relayPort = session.port
      this._initSocket(this.socket)
      this._initRelay()
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
    this.client.on('data', (data) => {
      this.cipher.decrypt(data)
    })

    socket.on('error', (err) => {
      debug('UDP relay connection socket error', err)
    })

    socket.on('close', () => {
      console.log('ending relay socket')
      this.emit('close')
    })
  }

  _initRelay () {
    let i = Math.random() * (100 - 1) + 1
    let padarr = [Buffer(this.desc['token'])]
    while (i > 0) {
      padarr.push(this.cipher.encryptzero())
      i = i - 1
    }
    this.client.send(Buffer.concat(padarr))
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

  write (connectionID, command, data) {
    let sendPacket = Buffer(7)
    sendPacket.writeUInt16BE(connectionID)
    sendPacket.write(command, 2)
    sendPacket.writeUInt32BE(data.length, 3)
    const b = Buffer.concat([sendPacket, data])
    const enc = this.cipher.encrypt(b)
    this.client.send(enc)
    this.emit('send', enc)
  }
}

export default UDPRelayConnection
