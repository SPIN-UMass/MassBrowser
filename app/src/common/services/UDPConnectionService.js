import { ConnectionReceiver} from '../../relay/net/ConnectionReceiver'
// import { networkMonitor } from '@/services'
import { warn, debug, info } from '@utils/log'
import { store } from '@utils/store'
import * as dgram from 'dgram'
import * as rudp from '../rudp'
import {EventEmitter} from 'events'
// import { UDPRelayConnectionError } from '@utils/errors'

export class UDPConnectionService extends EventEmitter {
  constructor () {
    super()
    this.authenticator = null
    this.upLimiter = null
    this.downLimiter = null
    this.server = null
    this.relayMode = false
    this.port = 10000 + Math.floor(Math.random() * (65535 - 10000))
    this._connections = {}
    this._isServerRunning = false
    this._natPunchingList = {}
  }

  setAuthenticator (authenticator) {
    this.authenticator = authenticator
  }

  setUpLimiter (upLimiter) {
    this.upLimiter = upLimiter
  }

  setDownLimiter (downLimiter) {
    this.downLimiter = downLimiter
  }

  setRelayMode (relayMode) {
    this.relayMode = relayMode
  }

  async setPort (port) {
    this.port = port
    await this.restart()
  }

  performUDPHolePunching (address, port) {
    return new Promise((resolve, reject) => {
      let addressKey = address + port
      if (this._natPunchingList[addressKey] && this._natPunchingList[addressKey].isPunched === true) {
        debug('Already punched')
        resolve()
      } else {
        let connection = this.getConnection(address, port)
        this._natPunchingList[addressKey] = {
          isPunched: false,
          pending: true
        }
        debug(`punching for ${address}:${port}`)
        connection.send(Buffer.from('HELLO'))
        resolve()
      }
    })
  }

  getLocalAddress () {
    return this.server.address()
  }

  getConnection (address, port, toEchoServer) {
    let connection
    let addressKey = address + port
    if (!this._connections[addressKey]) {
      connection = new rudp.Connection(new rudp.PacketSender(this.server, address, port), toEchoServer)
      this._connections[addressKey] = connection
      if (this.relayMode) {
        this._handleConnection(connection, addressKey)
      }
    } else {
      connection = this._connections[addressKey]
    }
    return connection
  }

  _handleConnection (connection, addressKey) {
    // ignore if this is a connection to echo server
    if (connection.toEchoServer()) {
      return
    }
    let upPipe = this.upLimiter.throttle()
    upPipe.on('error', (err) => { debug(err) })
    let downPipe = this.downLimiter.throttle()
    downPipe.on('error', (err) => { debug(err) })
    connection.on('data', data => {
      if (data.toString() === 'HELLO') {
        if (this._natPunchingList[addressKey]) {
          this._natPunchingList[addressKey].isPunched = true
          this._natPunchingList[addressKey].pending = false
        } else {
          this._natPunchingList[addressKey] = {
            isPunched: true
          }
        }
      } else {
        upPipe.write(data)
      }
    })

    downPipe.on('data', data => {
      connection.write(data)
    })

    let receiver = new ConnectionReceiver(upPipe, downPipe, connection, this.authenticator)

    connection.on('finish', () => {
      delete this._natPunchingList[addressKey]
      delete this._connections[addressKey]
      receiver.closeConnections()
      connection.unpipe(upPipe)
      downPipe.unpipe(connection)
      downPipe.end()
      upPipe.end()
    })
  }

  async start () {
    return new Promise((resolve, reject) => {
      if (this.server) {
        debug('UDP Connection Service is already running')
        resolve()
      } else {
        this.server = dgram.createSocket('udp4')
        this.server.bind({
          port: this.port,
          exclusive: false
        })

        this.server.on('message', (message, remoteInfo) => {
          let addressKey = remoteInfo.address + remoteInfo.port
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port)
          let packet = new rudp.Packet(message)
          if (packet.getIsFinish()) {
            delete this._connections[addressKey]
          } else {
            setImmediate(() => {
              connection.receive(packet)
            })
          }
        })

        this.server.on('listening', () => {
          info('UDP Connection Service is started', this.port)
          this._isServerRunning = true
          this.emit('start')
          resolve()
        })

        this.server.on('error', (e) => {
          console.log('UDP Connection Service Error: ', e)
          if (!this._isServerRunning) {
            reject(e)
          }
        })
      }
    })
  }

  async stop () {
    return new Promise((resolve, reject) => {
      if (this._isServerRunning) {
        console.log('stopping the server')
        this._connections = {}
        this.server.close(() => {
          this.server = null
          this._isServerRunning = false
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  async restart () {
    await this.stop()
    await this.start()
  }
}

const udpConnectionService = new UDPConnectionService()
export default udpConnectionService
