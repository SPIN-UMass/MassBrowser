import { warn, debug, info } from '@utils/log'
import { store } from '@utils/store'
import * as dgram from 'dgram'
import * as rudp from '../rudp'
import { EventEmitter } from 'events'
import { Semaphore } from 'await-semaphore'
const crypto = require('crypto')
export class UDPConnectionService extends EventEmitter {
  constructor () {

    super()
    this.mainServer = null
    this.secondServer = null
    this.relayMode = false
    this.port = 10000 + Math.floor(Math.random() * (65535 - 10000))
    this.secondPort = 10000 + Math.floor(Math.random() * (65535 - 10000))
    this._connections = {}
    this._UDPSessionKeyMap = {}
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
    debug('updating Natpunching list for ', addressKey)
    if (this._natPunchingList[addressKey]) {
      this._natPunchingList[addressKey].isPunched = true
    } else {
      this._natPunchingList[addressKey] = {
        isPunched: true
      }
    }
  }

  deleteNatPunchingListItem (addressKey) {
    this._natPunchingList[addressKey] = null
    delete this._natPunchingList[addressKey]
  }

  deleteConnectionListItem (addressKey) {
    this._connections[addressKey] = null
    delete this._connections[addressKey]
  }

  sendDummyPacket (address, port) {
    this.mainServer.send(Buffer.alloc(0), port, address)
  }

  sendPacket (address, port, str, useSecondServer) {
    if (useSecondServer) {
      this.secondServer.send(Buffer.from(str), port, address)
    } else {
      this.mainServer.send(Buffer.from(str), port, address)
    }
  }

  addExpectedIncomingConnection (key) {
    return new Promise((resolve, reject) => {
      // let key = address + ':' + port
      this._expectedConnections[key] = true
      setTimeout(() => {
        if (this._expectedConnections[key]) {
          this._expectedConnections[key] = null
          delete this._expectedConnections[key]
        }
      }, 20000)
      resolve()
    })
  }

  createEncryptedConnection (address, port, sessionKey, UDPSessionKey, useAltPort) {
    let connection
    let addressKey = address + ':' + port  + this.port
    let secondAddressKey = address + ':' + port  + this.secondPort
    if (useAltPort) {
        debug('creating encrypted connection alt', secondAddressKey)
      if (this._connections[secondAddressKey]) {
        this.deleteConnectionListItem(secondAddressKey)
        this.deleteNatPunchingListItem(secondAddressKey)
      }
      connection = new rudp.Connection(new rudp.PacketSender(this.secondServer, address, port, sessionKey))
      connection.on('close', () => {
        this.deleteNatPunchingListItem(secondAddressKey)
        this.deleteConnectionListItem(secondAddressKey)
      })
      this._connections[secondAddressKey] = connection 
    } else {
      debug('creating encrypted connection main', addressKey)
      if (this._connections[addressKey]) {
        this.deleteConnectionListItem(addressKey)
        this.deleteNatPunchingListItem(addressKey)
      }
      connection = new rudp.Connection(new rudp.PacketSender(this.mainServer, address, port, sessionKey))
      connection.on('close', () => {
        this.deleteNatPunchingListItem(addressKey)
        this.deleteConnectionListItem(addressKey)
      })
      this._connections[addressKey] = connection       
    }
    debug('connections:', Object.keys(this._connections).map((addressKey) => {
      let c = this._connections[addressKey]
      return addressKey + ' ' + c.currentTCPState
    }))
    return connection
  }

  generateSessionUDPKey (token) {
    return crypto.createHash('sha1').update(token).digest('hex')
  }

  getUDPSessionKey (message) {
    return message.toString()
  }

  performUDPHolePunchingRelay (address, port, token) {
    return new Promise((resolve, reject) => {
      let UDPSessionKey = this.generateSessionUDPKey(token)
      this._UDPSessionKeyMap[UDPSessionKey] = {
        'token': token
      }
      this.addExpectedIncomingConnection(UDPSessionKey)
      let addressKey = address + ':' + port  + this.port
      if (this._natPunchingList[addressKey] && this._natPunchingList[addressKey].isPunched === true) {
        debug('Already punched')
        resolve(this._connections[addressKey])
      } else {
        this._natPunchingList[addressKey] = {
          isPunched: false
        }
        debug(`punching for ${address}:${port} ${UDPSessionKey}`)
        let interval = setInterval(() => {
          this.sendPacket(address, port, UDPSessionKey, false)
        }, 500)

        let timer = setTimeout(() => {
          resolve()
          clearInterval(interval)
          interval = null
        }, 3000)
      }
    })
  }

  performUDPHolePunchingClientv2 (address, port, token) {
    return new Promise((resolve, reject) => {
      let UDPSessionKey = this.generateSessionUDPKey(token)
      debug(`punching for ${address}:${port} ${UDPSessionKey}`)
      let interval = setInterval(() => {
        this.sendPacket(address, port, UDPSessionKey, false)
        this.sendPacket(address, port, UDPSessionKey, true)
      }, 500);

      let timer = setTimeout(() => {
        debug('NAT Punching failed for ', address,':', port)
        clearInterval(interval)
        interval = null
        this._UDPSessionKeyMap[UDPSessionKey] = null
        delete this._UDPSessionKeyMap[UDPSessionKey]
        reject()
      }, 10000)

      this._UDPSessionKeyMap[UDPSessionKey] = {
        'token': token,
        'punchResolve': resolve,
        'punchInterval': interval,
        'punchTimer': timer
      }
    })
  }

  performUDPHolePunchingClient (address, port) {
    return new Promise((resolve, reject) => {
      let addressKey = address + ':' + port  + this.port
      let secondAddressKey = address + ':' + port  + this.secondPort
      if (this._natPunchingList[addressKey] && this._natPunchingList[addressKey].isPunched === true) {
        debug('Already punched')
        resolve(this._connections[addressKey])
      } else if (this._natPunchingList[secondAddressKey] && this._natPunchingList[secondAddressKey].isPunched === true) {
        debug('NAT is already punched using second port')
        resolve(this._connections[secondAddressKey])
      } else {
        let connection = this.getConnection(address, port, false)
        let secondConnection = this.getConnection(address, port, true)
        let timer = setTimeout(() => {
          debug('NAT Punching failed for ', address,':', port)
          reject()
        }, 10000)
        this._natPunchingList[addressKey] = {
          isPunched: false
        }
        this._natPunchingList[secondAddressKey] = {
          isPunched: false
        }
        debug(`punching for ${address}:${port}`)
        if (connection) {
          connection.on('connect', () => {
            this._natPunchingList[addressKey].isPunched = true
            clearTimeout(timer)
            resolve(this._connections[addressKey])
          })
          connection.send(Buffer.alloc(0))
        }
        if (secondConnection) {
          secondConnection.on('connect', () => {
            this._natPunchingList[secondAddressKey].isPunched = true
            clearTimeout(timer)
            resolve(this._connections[secondAddressKey])
          })
          secondConnection.send(Buffer.alloc(0))
        }
      }
    })
  }

  getLocalAddress () {
    return this.mainServer.address()
  }

  getConnection (address, port, useSecondPort) {
    let connection
    let addressKey = address + ':' + port  + this.port
    let secondAddressKey = address + ':' + port  + this.secondPort
    if (useSecondPort) {
      if (this.secondServer === null) {
        return null
      }
      if (!this._connections[secondAddressKey]) {
        if (port !== 19302) {
          debug('IGNORING THE INCOMMING CONNECTION', addressKey)
          return null
        }
        connection = new rudp.Connection(new rudp.PacketSender(this.secondServer, address, port))
        connection.on('stun-data', (tid, data) => {
          if (data && data.port && data.address) {
            this.emit('stun-data', tid, data)
          }
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
        if (port !== 19302) {
          debug('IGNORING THE INCOMMING CONNECTION', addressKey)
          return null
        }
        connection = new rudp.Connection(new rudp.PacketSender(this.mainServer, address, port))
        connection.on('stun-data', (tid, data) => {
          if (data && data.port && data.address) {
            this.emit('stun-data', tid, data)
          }
        })
        connection.on('close', () => {
          this.deleteNatPunchingListItem(addressKey)
          this.deleteConnectionListItem(addressKey)
        })
        this._connections[addressKey] = connection
      } else {
        let key = address + ':' + port
        connection = this._connections[addressKey]
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

  isPunchingMessage (message, remoteInfo) {
    if (message.length === 40) {
      return true
    } else {
      return false
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
            return
          }
          debug('got message', message.toString(), remoteInfo)
          if (this.isPunchingMessage(message)) {
            debug('it is punching')
            let UDPSessionKey = this.getUDPSessionKey(message)
            if (!this._UDPSessionKeyMap[UDPSessionKey]) {
              debug('ignored')
              return
            }
            let sessionToken = this._UDPSessionKeyMap[UDPSessionKey]['token']
            let addressKey = remoteInfo.address + ':' + remoteInfo.port  + this.port
            let connection
            if (!this._connections[addressKey]) {
              connection = this.createEncryptedConnection(remoteInfo.address, remoteInfo.port, sessionToken, UDPSessionKey, false)
              if (this._expectedConnections[UDPSessionKey]) {
                this.emit('relay-new-connection', connection)
              } else {
                debug('trying to resolve')
                setTimeout(() => {
                  this._UDPSessionKeyMap[UDPSessionKey].punchResolve(connection)
                }, 2000)
                clearTimeout(this._UDPSessionKeyMap[UDPSessionKey]['punchTimer'])
                clearInterval(this._UDPSessionKeyMap[UDPSessionKey]['punchInterval'])
              }
            }
            return
          }
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port)
          if (connection) {
            if (rudp.StunPacket.isStunPacket(message)) {
              setImmediate(() => {
                connection.receiveStunPacket(message)
              })
            } else {
                setImmediate(() => {
                connection.receive(message)
              })
            }
          }
        })

        this.mainServer.on('listening', () => {
          info('UDP Connection Service is started', this.port)
          this._isMainServerRunning = true
          this.emit('start')
          resolve()
        })

        this.mainServer.on('error', (e) => {
          debug('UDP Connection Service Error: ', e)
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
          debug('got message', message.toString(), remoteInfo)
          if (message.length < 12) {
            return
          }
          if (this.isPunchingMessage(message)) {
            debug('it is punching second')
            let UDPSessionKey = this.getUDPSessionKey(message)
            if (!this._UDPSessionKeyMap[UDPSessionKey]) {
              debug('ignored second')
              return
            }
            let sessionToken = this._UDPSessionKeyMap[UDPSessionKey]['token']
            let addressKey = remoteInfo.address + ':' + remoteInfo.port  + this.secondPort
            let connection
            if (!this._connections[addressKey]) {
              connection = this.createEncryptedConnection(remoteInfo.address, remoteInfo.port, sessionToken, UDPSessionKey, true)
              if (this._expectedConnections[UDPSessionKey]) {
                this.emit('relay-new-connection', connection)
              } else {
                debug('trying to resolve second')
                setTimeout(() => {
                  this._UDPSessionKeyMap[UDPSessionKey].punchResolve(connection)
                }, 2000)
                clearTimeout(this._UDPSessionKeyMap[UDPSessionKey]['punchTimer'])
                clearInterval(this._UDPSessionKeyMap[UDPSessionKey]['punchInterval'])
              }
            }
            return
          }
          let connection = this.getConnection(remoteInfo.address, remoteInfo.port, true)
          if (connection) {
            if (rudp.StunPacket.isStunPacket(message)) {
              setImmediate(() => {
                connection.receiveStunPacket(message)
              })
            } else {
                setImmediate(() => {
                connection.receive(message)
              })
            }
          }
        })

        this.secondServer.on('listening', () => {
          info('Second UDP Connection Service is started', this.secondPort)
          this._isSecondServerRunning = true
          this.emit('start')
          resolve()
        })

        this.secondServer.on('error', (e) => {
          debug('UDP Connection Service Error: ', e)
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
    debug('closing all connections')
    let promises = []
    for (let addressKey in this._connections) {
      let connection = this._connections[addressKey]
      let promise = new Promise((resolve, reject) => {
        connection.on('close', () => {
          connection.removeAllListeners(['close'])
          resolve()
        })
      })
      connection.close()
      promises.push(promise)
    }
    debug('waiting for connections to close')
    return Promise.all(promises)
  }

  async stopMainServer () {
    return new Promise(async (resolve, reject) => {
      if (this._isMainServerRunning) {
        await this.closeAllConnections()
          .then(() => {
            debug('all connections are closed')
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
