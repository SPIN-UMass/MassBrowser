import { Crypto } from '@utils/crypto'
import { EventEmitter } from 'events'
import { info, debug, warn } from '@utils/log'
import udpConnectionService from '@common/services/UDPConnectionService'

export class UDPRelayConnection extends EventEmitter {
  constructor (relayAddress, relayPort, desc) {
    super()
    this.id = ''
    this.relayAddress = relayAddress
    this.relayPort = relayPort
    this.desc = desc
    this.sessionID = ''
    this.cipher = null
    this.firstAttemptTimer = null
    this.secondAttemptTimer = null
    this.socket = null
    this.dgramSocket = null
  }

  connect () {
    return new Promise((resolve, reject) => {
      let connection = udpConnectionService.getConnection(this.relayAddress, this.relayPort)
      debug('started the timer for first try')
      this.firstAttemptTimer = setTimeout(() => {
        debug('first attempt failed closing the connection')
        this.socket.end()
        this.emit('close')
        debug('starting second attempt')
        let connection = udpConnectionService.getConnection(this.relayAddress, this.relayPort, false, true)
        this._initSocket(connection).then((socket) => this._initRelay(socket))
        debug('starting second timer')
        this.secondAttemptTimer = setTimeout(() => {
          debug('FAILED TO CONNECT DO STUFF HERE')
        }, 10000)
      }, 10000)
      info(`Relay ${this.id} UDP connected`)
      resolve(connection)
      // this.dgramSocket.on('listening', () => {

      // this.dgramSocket.on('error', err => {
      //   warn(`Relay ${this.id} UDP connection error: ${err.message}`)
      //   this.dgramSocket.close()
      //   reject(new UDPRelayConnectionError(err))
      // })
      //   info(`Relay ${this.id} UDP connected`)
      //   resolve(connection)
      // })
      // this.dgramSocket.on('message', (message, rinfo) => {
      //   if (rinfo.address !== this.relayAddress || rinfo.port !== this.relayPort) {
      //     return
      //   }
      //   let packet = new rudp.Packet(message)
      //   if (packet.getIsFinish()) {
      //     warn('got the finish packet')
      //     this.dgramSocket.close()
      //     return
      //   }
      //   connection.receive(packet)
      // })
    })
      .then((socket) => this._initSocket(socket))
      .then((socket) => this._initRelay(socket))
  }

  sessionFounded (session) {
    return new Promise((resolve, reject) => {
      this.desc = session.desc
      this.relayAddress = session.ip
      this.relayPort = session.UDPPort
      this._initSocket(this.socket)
      this._initRelay(this.socket)
      resolve()
    })
  }

  _initSocket (socket) {
    return new Promise((resolve, reject) => {
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
        if (data.toString() === 'HELLO') {
          if (this.firstAttemptTimer) {
            clearTimeout(this.firstAttemptTimer)
            this.firstAttemptTimer = null
          } else if (this.secondAttemptTimer) {
            clearTimeout(this.secondAttemptTimer)
            this.secondAttemptTimer = null
          }
          console.log('got the punching message')
        } else {
          this.cipher.decrypt(data)
        }
      })

      socket.on('error', (err) => {
        warn('socket(connection) error', err)
        this.emit('close')
      })

      socket.on('finish', () => {
        this.emit('close')
      })
      resolve(socket)
    })
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
    if (this.socket.writable) {
      this.socket.write(enc)
    }
  }
}

export default UDPRelayConnection
