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
    this._connections = {}
    this._isMainServerRunning = false
    this._isSecondServerRunning = false
    this._natPunchingList = {}
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

  performUDPHolePunchingRelay (address, port) {
    return new Promise((resolve, reject) => {
      let addressKey = address + port + this.port
      if (this._natPunchingList[addressKey] && this._natPunchingList[addressKey].isPunched === true) {
        debug('Already punched')
        resolve(this._connections[addressKey])
      } else {
        let connection = this.getConnection(address, port, false, false)
        this._natPunchingList[addressKey] = {
          isPunched: false
        }
        debug(`punching for ${address}:${port}`)
        connection.send(Buffer.from('HELLO'))
        resolve()
      }
    })
  }

  performUDPHolePunchingClient (address, port) {
    return new Promise((resolve, reject) => {
      let addressKey = address + port + this.port
      let secondAddressKey = address + port + (this.port + 1)
      if (this._natPunchingList[addressKey] && this._natPunchingList[addressKey].isPunched === true) {
        debug('Already punched')
        resolve(this._connections[addressKey])
      } else if (this._natPunchingList[secondAddressKey] && this._natPunchingList[secondAddressKey].isPunched === true) {
        debug('NAT is already punched using second port')
        resolve(this._connections[secondAddressKey])
      } else {
        let connection = this.getConnection(address, port, false, false)
        let secondConnection = this.getConnection(address, port, false, true)
        let timer = setTimeout(() => {
          debug('NAT Punching failed')
          connection.removeListener('data', onData)
          secondConnection.removeListener('data', onData)
          reject()
        }, 10000)
        const onData = (data, addressKey) => {
          if (data.toString() === 'HELLO') {
            this._natPunchingList[addressKey].isPunched = true
            connection.removeListener('data', onData)
            secondConnection.removeListener('data', onData)
            clearTimeout(timer)
            resolve(this._connections[addressKey])
          }
        }
        connection.on('data', (data) => onData(data, addressKey))
        secondConnection.on('data', data => onData(data, secondAddressKey))
        this._natPunchingList[addressKey] = {
          isPunched: false
        }
        this._natPunchingList[secondAddressKey] = {
          isPunched: false
        }
        debug(`punching for ${address}:${port}`)
        connection.send(Buffer.from('HELLO'))
        secondConnection.send(Buffer.from('HELLO'))
      }
    })
  }

  getLocalAddress () {
    return this.mainServer.address()
  }

  getConnection (address, port, toEchoServer, useSecondPort) {
    let connection
    let addressKey = address + port + this.port
    let secondAddressKey = address + port + (this.port + 1)
    if (useSecondPort) {
      if (!this._connections[secondAddressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.secondServer, address, port))
        this._connections[secondAddressKey] = connection
      } else {
        connection = this._connections[secondAddressKey]
      }
    } else {
      if (!this._connections[addressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.mainServer, address, port))
        this._connections[addressKey] = connection
        if (this.relayMode && !toEchoServer) {
          this._handleConnection(connection, addressKey)
        }
      } else {
        connection = this._connections[addressKey]
      }
    }
    return connection
  }

  // this function will be only used by relays
  _handleConnection (connection, addressKey) {
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

  async start (relayMode) {
    this.relayMode = relayMode || false
    await this.startMainServer()
    if (!relayMode) {
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
          let addressKey = remoteInfo.address + remoteInfo.port + this.port
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
          let addressKey = remoteInfo.address + remoteInfo.port + (this.port + 1)
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port, false, true)
          let packet = new rudp.Packet(message)
          if (packet.getIsFinish()) {
            delete this._connections[addressKey]
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
        this._connections = {}
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
        this._connections = {}
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
    await this.start(this.relayMode)
  }
}

const udpConnectionService = new UDPConnectionService()
export default udpConnectionService
