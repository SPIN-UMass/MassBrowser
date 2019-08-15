import { ConnectionReceiver } from '../../relay/net/ConnectionReceiver'
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
    this.mainServer = null
    this.secondServer = null
    this.relayMode = false
    this.port = 10000 + Math.floor(Math.random() * (65535 - 10000))
    this._mainServerConnections = {}
    this._secondServerConnections = {}
    this._isMainServerRunning = false
    this._isSecondServerRunning = false
    this._natPunchingList = {}
    this._secondNatPunchingList = {}
    this.useSecondPort = false
  }

  setUseSecondPort (useSecondPort) {
    this.useSecondPort = useSecondPort
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

  // this function should only be used by relays
  async setPort (port) {
    this.port = port
    await this.restart()
  }

  performUDPHolePunching (address, port, useSecondPort) {
    return new Promise((resolve, reject) => {
      let addressKey = address + port
      if (useSecondPort) {
        if (this._secondNatPunchingList[addressKey] && this._secondNatPunchingList[addressKey].isPunched === true) {
          debug('Already punched')
          resolve()
        } else {
          let connection = this.getConnection(address, port, false, true)
          this._secondNatPunchingList[addressKey] = {
            isPunched: false,
            pending: true
          }
          debug(`punching for ${address}:${port} using second port`)
          connection.send(Buffer.from('HELLO'))
          resolve()
        }
      } else {
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
      }
    })
  }

  getLocalAddress () {
    return this.mainServer.address()
  }

  getConnection (address, port, toEchoServer, useSecondPort) {
    let connection
    let addressKey = address + port
    if (useSecondPort) {
      if (!this._secondServerConnections[addressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.secondServer, address, port), toEchoServer)
        this._secondServerConnections[addressKey] = connection
      } else {
        connection = this._secondServerConnections[addressKey]
      }
    } else {
      if (!this._mainServerConnections[addressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.mainServer, address, port), toEchoServer)
        this._mainServerConnections[addressKey] = connection
        if (this.relayMode) {
          this._handleConnection(connection, addressKey)
        }
      } else {
        connection = this._mainServerConnections[addressKey]
      }
    }
    return connection
  }

  // this function will be only used by relays
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
      delete this._mainServerConnections[addressKey]
      receiver.closeConnections()
      connection.unpipe(upPipe)
      downPipe.unpipe(connection)
      downPipe.end()
      upPipe.end()
    })
  }

  async start () {
    await this.startMainServer()
    if (this.useSecondPort) {
      await this.startSecondServer()
    }
  }

  async startMainServer () {
    return new Promise((resolve, reject) => {
      if (this.mainServer) {
        debug('UDP Connection Service is already running')
        resolve()
      } else {
        this.mainServer = dgram.createSocket('udp4')
        this.mainServer.bind({
          port: this.port,
          exclusive: false
        })

        this.mainServer.on('message', (message, remoteInfo) => {
          let addressKey = remoteInfo.address + remoteInfo.port
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port)
          let packet = new rudp.Packet(message)
          if (packet.getIsFinish()) {
            delete this._mainServerConnections[addressKey]
          } else {
            setImmediate(() => {
              connection.receive(packet)
            })
          }
        })

        this.mainServer.on('listening', () => {
          info('UDP Connection Service is started', this.port)
          this._isMainServerRunning = true
          this.emit('start')
          resolve()
        })

        this.mainServer.on('error', (e) => {
          console.log('UDP Connection Service Error: ', e)
          if (!this._isMainServerRunning) {
            reject(e)
          }
        })
      }
    })
  }

  async startSecondServer () {
    return new Promise((resolve, reject) => {
      if (this.secondServer) {
        debug('UDP Connection Service is already running')
        resolve()
      } else {
        this.secondServer = dgram.createSocket('udp4')
        this.secondServer.bind({
          port: this.port + 1,
          exclusive: false
        })

        this.secondServer.on('message', (message, remoteInfo) => {
          let addressKey = remoteInfo.address + remoteInfo.port
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port, false, true)
          let packet = new rudp.Packet(message)
          if (packet.getIsFinish()) {
            delete this._secondServerConnections[addressKey]
          } else {
            setImmediate(() => {
              connection.receive(packet)
            })
          }
        })

        this.secondServer.on('listening', () => {
          info('Second UDP Connection Service is started', this.port + 1)
          this._isSecondServerRunning = true
          this.emit('start')
          resolve()
        })

        this.secondServer.on('error', (e) => {
          console.log('UDP Connection Service Error: ', e)
          if (!this._isSecondServerRunning) {
            reject(e)
          }
        })
      }
    })
  }

  async stop () {
    await this.stopMainServer()
    await this.stopSecondServer()
  }

  async stopMainServer () {
    return new Promise((resolve, reject) => {
      if (this._isMainServerRunning) {
        this._mainServerConnections = {}
        this.mainServer.close(() => {
          this.mainServer = null
          this._natPunchingList = {}
          this._isMainServerRunning = false
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  async stopSecondServer () {
    return new Promise((resolve, reject) => {
      if (this._isSecondServerRunning) {
        this._secondServerConnections = {}
        this.secondServer.close(() => {
          this.secondServer = null
          this._secondNatPunchingList = {}
          this._isSecondServerRunning = false
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
