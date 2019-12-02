import { warn, debug, info } from '@utils/log'
import { store } from '@utils/store'
import * as dgram from 'dgram'
import * as rudp from '../rudp'
import { EventEmitter } from 'events'

export class UDPConnectionService extends EventEmitter {
  constructor () {
    super()
    this.mainServer = null
    this.secondServer = null
    this.relayMode = false
    this.port = 10000 + Math.floor(Math.random() * (65535 - 10000))
    this.secondPort = 10000 + Math.floor(Math.random() * (65535 - 10000))
    this._connections = {}
    this._isMainServerRunning = false
    this._isSecondServerRunning = false
    this._natPunchingList = {}
  }

  setUseSecondPort (useSecondPort) {
    this.useSecondPort = useSecondPort
  }

  setRelayMode (relayMode) {
    this.relayMode = relayMode
  }

  // this function should only be used by relays
  async setPort (port) {
    // closing all connections that were using prev port
    await this.closeAllConnections()
    this.port = port
    await this.restart()
  }

  updateNatPunchingListItem (addressKey) {
    if (this._natPunchingList[addressKey]) {
      this._natPunchingList[addressKey].isPunched = true
    } else {
      this._natPunchingList[addressKey] = {
        isPunched: true
      }
    }
  }

  deleteNatPunchingListItem (addressKey) {
    delete this._natPunchingList[addressKey]
  }

  deleteConnectionListItem (addressKey) {
    delete this._connections[addressKey]
  }

  sendDummyPacket (address, port) {
    this.mainServer.send(Buffer.alloc(0), port, address)
  }

  performUDPHolePunchingRelay (address, port) {
    return new Promise((resolve, reject) => {
      let addressKey = address + port + this.port
      if (this._natPunchingList[addressKey] && this._natPunchingList[addressKey].isPunched === true) {
        debug('Already punched')
        resolve(this._connections[addressKey])
      } else {
        this._natPunchingList[addressKey] = {
          isPunched: false
        }
        debug(`punching for ${address}:${port}`)
        for (let i = 1; i < 5; i++) {
          this.sendDummyPacket(address, port)
        }
        resolve()
      }
    })
  }

  performUDPHolePunchingClient (address, port) {
    return new Promise((resolve, reject) => {
      let addressKey = address + port + this.port
      // let secondAddressKey = address + port + this.secondPort
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
        connection.on('connect', () => {
          this._natPunchingList[addressKey].isPunched = true
          clearTimeout(timer)
          resolve(this._connections[addressKey])
        })
        secondConnection.on('connect', () => {
          this._natPunchingList[secondAddressKey].isPunched = true
          clearTimeout(timer)
          resolve(this._connections[secondAddressKey])
        })
        let timer = setTimeout(() => {
          debug('NAT Punching failed')
          reject()
        }, 10000)
        this._natPunchingList[addressKey] = {
          isPunched: false
        }
        this._natPunchingList[secondAddressKey] = {
          isPunched: false
        }
        debug(`punching for ${address}:${port}`)
        connection.send(Buffer.alloc(0))
        secondConnection.send(Buffer.alloc(0))
      }
    })
  }

  getLocalAddress () {
    return this.mainServer.address()
  }

  getConnection (address, port, toEchoServer, useSecondPort) {
    let connection
    let addressKey = address + port + this.port
    // let secondAddressKey = address + port + this.secondPort
    let secondAddressKey = address + port + (this.port + 1)
    if (useSecondPort) {
      if (this.secondServer === null) {
        return null
      }
      if (!this._connections[secondAddressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.secondServer, address, port))
        connection.on('close', () => {
          this.deleteConnectionListItem(addressKey)
        })
        this._connections[secondAddressKey] = connection
      } else {
        connection = this._connections[secondAddressKey]
      }
    } else {
      if (!this._connections[addressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.mainServer, address, port))
        connection.on('close', () => {
          this.deleteNatPunchingListItem(addressKey)
          this.deleteConnectionListItem(addressKey)
        })
        this._connections[addressKey] = connection
        if (this.relayMode && !toEchoServer) {
          this.emit('relay-new-connection', connection, addressKey)
        }
      } else {
        connection = this._connections[addressKey]
      }
    }
    return connection
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
          if (message.length < 12) {
            // dummy message
            return
          }
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port)
          let packet = new rudp.Packet(message)
          setImmediate(() => {
            connection.receive(packet)
          })
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
          // port: this.secondPort,
          port: this.port + 1,
          exclusive: false
        })

        this.secondServer.on('message', (message, remoteInfo) => {
          if (message.length < 12) {
            return
          }
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port, false, true)
          let packet = new rudp.Packet(message)
          setImmediate(() => {
            connection.receive(packet)
          })
        })

        this.secondServer.on('listening', () => {
          info('Second UDP Connection Service is started', this.secondPort)
          this._isSecondServerRunning = true
          this.emit('start')
          resolve()
        })

        this.secondServer.on('error', (e) => {
          console.log('UDP Connection Service Error: ', e)
          this.secondPort = 10000 + Math.floor(Math.random() * (65535 - 10000))
          this.secondServer.bind({
            port: this.secondPort,
            exclusive: false
          })
        })
      }
    })
  }

  async stop () {
    await this.stopMainServer()
    await this.stopSecondServer()
  }

  closeAllConnections () {
    console.log('closing all connections')
    let promises = []
    for (let addressKey in this._connections) {
      let connection = this._connections[addressKey]
      connection.removeListener('close', () => this.deleteConnectionListItem(addressKey))
      let promise = new Promise((resolve, reject) => {
        connection.on('close', () => {
          resolve()
        })
      })
      connection.close()
      promises.push(promise)
    }
    console.log('waiting for connections to close')
    return Promise.all(promises)
  }

  async stopMainServer () {
    return new Promise(async (resolve, reject) => {
      if (this._isMainServerRunning) {
        await this.closeAllConnections()
          .then(() => {
            console.log('all connections are close')
            this._connections = {}
            this.mainServer.close(() => {
              this.mainServer = null
              this._natPunchingList = {}
              this._isMainServerRunning = false
              resolve()
            })
          })
      } else {
        resolve()
      }
    })
  }

  async stopSecondServer () {
    return new Promise((resolve, reject) => {
      if (this._isSecondServerRunning) {
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
