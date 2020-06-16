import { warn, debug, info } from '@utils/log'
import { store } from '@utils/store'
import * as dgram from 'dgram'
import * as rudp from '../rudp'
import { EventEmitter } from 'events'
import { Semaphore } from 'await-semaphore'

export class UDPConnectionService extends EventEmitter {
  constructor () {

    super()
    this.mainServer = null
    this.secondServer = null
    this.relayMode = false
    this.port = 10000 + Math.floor(Math.random() * (65535 - 10000))
    this.secondPort = 10000 + Math.floor(Math.random() * (65535 - 10000))
    this._connections = {}
    this._expectedConnections = {}
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
    console.log(addressKey, 'removed')
    console.log(Object.keys(this._connections))
    delete this._connections[addressKey]
    console.log(Object.keys(this._connections))
  }

  sendDummyPacket (address, port) {
    this.mainServer.send(Buffer.alloc(0), port, address)
  }

  addExpectedIncomingConnection (address) {
    return new Promise((resolve, reject) => {
      console.log(address, 'added into the incomming connections')
      this._expectedConnections[address] = true
      setTimeout(() => {
        if (this._expectedConnections[address]) {
          delete this._expectedConnections[address]
        }
      }, 20000)
      resolve()
    })
  }

  createEncryptedConnection (address, port, sessionKey, useAltPort) {
    let connection
    let addressKey = address + port + this.port
    let secondAddressKey = address + port + this.secondPort
    if (useAltPort) {
      if (!this._connections[secondAddressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.secondServer, address, port, sessionKey))
        connection.on('close', () => {
          this.deleteNatPunchingListItem(secondAddressKey)
          this.deleteConnectionListItem(secondAddressKey)
        })
        this._connections[secondAddressKey] = connection
      } else {
        console.log(secondAddressKey, 'There is already a connection')
      }
    }
    if (!this._connections[addressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.mainServer, address, port, sessionKey))
        connection.on('close', () => {
          this.deleteNatPunchingListItem(addressKey)
          this.deleteConnectionListItem(addressKey)
        })
        this._connections[addressKey] = connection
      } else {
        console.log(addressKey, 'There is already a connection')
    }
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
      let secondAddressKey = address + port + this.secondPort
      if (this._natPunchingList[addressKey] && this._natPunchingList[addressKey].isPunched === true) {
        debug('Already punched')
        resolve(this._connections[addressKey])
      } else if (this._natPunchingList[secondAddressKey] && this._natPunchingList[secondAddressKey].isPunched === true) {
        debug('NAT is already punched using second port')
        resolve(this._connections[secondAddressKey])
      } else {
        let connection = this.getConnection(address, port, false)
        let secondConnection = this.getConnection(address, port, true)
        connection.on('connect', () => {
          this._natPunchingList[addressKey].isPunched = true
          clearTimeout(timer)
          secondConnection.close().then(() => {
            console.log('using main the other connection has been closed')
            this.deleteConnectionListItem(secondAddressKey)
          })
          resolve(this._connections[addressKey])
        })
        secondConnection.on('connect', () => {
          this._natPunchingList[secondAddressKey].isPunched = true
          clearTimeout(timer)
          connection.close().then(() => {
            console.log('using alt the other connection has been closed')
            this.deleteConnectionListItem(addressKey)
          })
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

  getConnection (address, port, useSecondPort) {
    let connection
    let addressKey = address + port + this.port
    let secondAddressKey = address + port + this.secondPort
    if (useSecondPort) {
      if (this.secondServer === null) {
        return null
      }
      if (!this._connections[secondAddressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.secondServer, address, port))
        connection.on('stun-data', (tid, data) => {
          this.emit('stun-data', tid, data)
        })
        connection.on('close', () => {
          this.deleteNatPunchingListItem(secondAddressKey)
          this.deleteConnectionListItem(secondAddressKey)
        })
        this._connections[secondAddressKey] = connection
      } else {
        connection = this._connections[secondAddressKey]
      }
    } else {
      if (!this._connections[addressKey]) {
        connection = new rudp.Connection(new rudp.PacketSender(this.mainServer, address, port))
        connection.on('stun-data', (tid, data) => {
          this.emit('stun-data', tid, data)
        })
        connection.on('close', () => {
          this.deleteNatPunchingListItem(addressKey)
          this.deleteConnectionListItem(addressKey)
        })
        this._connections[addressKey] = connection
      } else {
        connection = this._connections[addressKey]
        if (this._expectedConnections[address]) {
          this.emit('relay-new-connection', connection, addressKey)
          delete this._expectedConnections[address]
        }
      }
    }
    return connection
  }

  async start (relayMode, mainPort, altPort) {
    if (mainPort && altPort) {
      this.port = mainPort
      this.secondPort = altPort
    }
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

        this.mainServer.on('message', async (message, remoteInfo) => {
          if (message.length < 12) {
            // dummy message
            console.log('DUMMY')
            return
          }
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port)
          if (rudp.StunPacket.isStunPacket(message)) {
            setImmediate(() => {
              connection.receiveStunPacket(message)
            })
          } else {
              setImmediate(() => {
              connection.receive(message)
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
          port: this.secondPort,
          exclusive: false
        })

        this.secondServer.on('message', (message, remoteInfo) => {
          if (message.length < 12) {
            return
          }
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port, true)
          if (rudp.StunPacket.isStunPacket(message)) {
            setImmediate(() => {
              connection.receiveStunPacket(message)
            })
          } else {
              setImmediate(() => {
              connection.receive(message)
            })
          }
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
            console.log('all connections are closed')
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
