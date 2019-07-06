import { Crypto } from '@utils/crypto'
import { EventEmitter } from 'events'
import { debug, warn } from '@utils/log'
import { UDPRelayConnectionError } from '@utils/errors'
import { pendMgr } from './PendingConnections'
import * as dgram from 'dgram'
import * as rudp from '@common/rudp'

export class UDPRelayConnection extends EventEmitter {
  constructor (relayAddress, relayPort, desc) {
    super()
    this.id = ''
    this.relayAddress = relayAddress
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
        this.client = new rudp.Client(socket, this.relayAddress, this.relayPort)
      }

      this.client.send(Buffer.from('TEST'))
      let connection = this.client.getConnection()

      const onFail = (err) => {
        warn(`Relay ${this.id} UDP connection error: ${err.message}`)
        reject(new UDPRelayConnectionError(err))
      }

      const onSuccess = () => {
        debug(`Relay ${this.id} UDP connected`)
        socket.removeListener('error', onFail)
        resolve(connection)
      }

      socket.once('connect', onSuccess)
      socket.once('error', onFail)
      resolve(connection)
    })
      .then((socket) => this._initSocket(socket))
      .then((socket) => this._initRelay(socket))
  }

  sessionFounded (session) {
    return new Promise((resolve, reject) => {
      this.desc = session.desc
      this.relayip = session.ip
      this.relayport = session.port
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
      this.socket.end()
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
    let desc = this.desc
    let i = Math.random() * (100 - 1) + 1
    let padarr = [Buffer(desc['token'])]
    while (i > 0) {
      padarr.push(this.cipher.encryptzero())
      i -= 1
    }
    socket.write(Buffer.concat(padarr))
    return socket
  }

  relayReverse (socket) {
    this.hasSessionID = false
    this.socket = socket

    const readable = (data) => {
      let sessionId = data.toString()
      this.hasSessionID = true
      this.sessionID = sessionId
      this.socket.removeListener('data', readable)
      pendMgr.setPendingConnection(this.sessionID, this)
    }
    this.socket.on('data', readable)
  }

  end () {
    this.socket.end()
  }

  write (connectionID, command, data) {
    let sendPacket = Buffer(7)
    sendPacket.writeUInt16BE(connectionID)
    sendPacket.write(command, 2)
    sendPacket.writeUInt32BE(data.length, 3)
    const b = Buffer.concat([sendPacket, data])
    const enc = this.cipher.encrypt(b)
    this.emit('send', enc)
    this.socket.write(enc)
  }
}

export default UDPRelayConnection
