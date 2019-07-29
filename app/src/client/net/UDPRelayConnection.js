import { Crypto } from '@utils/crypto'
import { EventEmitter } from 'events'
import { info, debug, warn } from '@utils/log'
import { UDPRelayConnectionError } from '@utils/errors'
import networkManager from './NetworkManager'
import * as dgram from 'dgram'
import * as rudp from '@common/rudp'

export class UDPRelayConnection extends EventEmitter {
  constructor (relayAddress, relayPort, desc) {
    super()
    this.id = ''
    this.relayAddress = relayAddress
    this.relayPort = relayPort
    this.desc = desc
    this.sessionID = ''
    this.cipher = null
    this.socket = null
  }

  connect () {
    return new Promise((resolve, reject) => {
      networkManager.stopUDPNATRoutine()
      let socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      socket.bind({
        port: networkManager.getLocalUDPPort(),
        address: networkManager.getLocalAddress(),
        exclusive: false
      })

      socket.on('error', err => {
        warn('UDP socket ERROR while trying to connect to relay: ', err)
      })

      let packetSender = new rudp.PacketSender(socket, this.relayAddress, this.relayPort)
      let connection = new rudp.Connection(packetSender)

      socket.on('message', function (message, rinfo) {
        if (rinfo.address !== this.relayAddress || rinfo.port !== this.relayPort) {
          return
        }
        let packet = new rudp.Packet(message)
        // if (packet.getIsFinish()) {
        //   socket.close()
        //   return
        // }
        connection.receive(packet)
      })

      info(`Relay ${this.id} UDP connected`)
      resolve(connection)

      socket.once('error', (err) => {
        warn(`Relay ${this.id} UDP connection error: ${err.message}`)
        reject(new UDPRelayConnectionError(err))
      })
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
      warn('socket(connection) error', err)
      if (!socket.writable) {
        warn('socket is not writable')
        this.emit('close')
      }
    })

    socket.on('finish', () => {
      console.log('FINISHED!!!!!!!!!!!!!!')
      warn('ending udp relay socket')
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
    try {
      if (this.socket.writable) {
        this.socket.write(enc)
      }
    } catch (e) {
      console.log('error while trying to write', e)
    }
  }
}

export default UDPRelayConnection
