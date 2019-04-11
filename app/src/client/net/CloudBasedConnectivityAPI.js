import KVStore from '~/utils/kvstore'
import * as util from 'util'
// const util = require('util')
import { EventEmitter } from 'events'
import API from '@/api'
import WebSocket from 'ws'
import * as errors from '~/utils/errors'
import { error, debug } from '~/utils/log'
import { runLocalServer } from './incommingConnection'
import * as net from 'net'

// Only used in boot.js on startup
class CloudBasedConnectivityAPI extends EventEmitter {
  constructor () {
    console.log("CloudBasedConnectivityAPI superclass constructor")
    super()

    console.log("CloudBasedConnectivityAPI constructor called.")
    this.server = ''
    this.port = 0
    this.socket = undefined
    this.isConnected = false
    this.autoConnect = false
    this.routineStatus = false
    this.ListenServer = {}
    this.localIP = ''
    this.isServerRunning = false
    this.remoteIP = ''
    this.localPort = 0
    this.remotePort = 0

    this.keepAliveInterval = null
  }

  respHandler (localIP, localPort, remoteIP, remotePort) {
    // console.log(localIP, localPort, remoteIP, remotePort)
    if (this.localPort !== localPort && this.localIP !== localIP && this.remotePort !== remotePort && this.remoteIP !== remoteIP) {
      this.localIP = localIP
      this.localPort = localPort
      this.remoteIP = remoteIP
      this.remotePort = remotePort
      this.restartListenerServer()
      API.updateClientAddress(remoteIP, remotePort)
    }

  }

  startRoutine () {
    return new Promise((resolve, reject) => {
      if (this.routineStatus) {
        return
      }
      this.routineStatus = true
      this._startKeepAlive()
      resolve()
    })

  }

  _startKeepAlive () {
    if (this.keepAliveInterval) {
      return
    }
    
    this.keepAliveInterval = setInterval(() => this.sendKeepAlive(), 30 * 1000)
  }

  checkStunServer () {
    return new Promise((resolve, reject) => {
      if (this.port === 0) {
        API.requestNewStunServer().then((data) => {
          this.server = data.ip
          this.port = data.port
          this.connect()
          resolve()
        })
      }
      resolve()
    })
  }

  sendKeepAlive () {
    this.checkStunServer().then(() => {
      this.socket.write('TEST')
    })

  }

  connect () {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection({
        port: this.port,
        host: this.server,
        localPort: 10000 + Math.floor(Math.random() * (65535 - 10000)),
        exclusive: false
      }, () => {
        debug('Connected to Echo Server')
        this.socket.write('TEST')
        this.socket.setKeepAlive(true)
        this.isConnected = true
        resolve()
      })
      this.socket.on('data', (data) => {
        data = data.toString()
        let ip = data.split(':')[0]
        let port = data.split(':')[1]
        this.respHandler(this.socket.localAddress, this.socket.localPort, ip, port)

      })
      this.socket.on('end', () => {
        debug('Connectivity Server Ended')
        this.isConnected = false

      })
      this.socket.on('close', () => {
        debug('Connectivity Server Ended')
        this.isConnected = false
      })

      this.socket.on('error', (e) => {
        debug('Connectivity Server Error', e)
        if (e.code === 'EADDRINUSE') {

          this.socket.close()
          this.socket.listen({
            port: this.port,
            host: this.server,
            localPort: 10000 + Math.floor(Math.random() * (65535 - 10000)),
            exclusive: false
          }, () => {
            debug('Connected to Echo Server')
            this.socket.write('TEST')
            this.socket.setKeepAlive(true)
            this.isConnected = true
          })
        } else {
          this.reconnect()
        }
      })
    })
  }

  reconnect () {
    debug('RECONNECTING CONNECTIVITY')
    this.connect().then(() => {
      debug('RECONNECTED CONNECTIVITY')
    })
  }

  stopListenServer () {
    if (this.isServerRunning) {
      this.ListenServer.close(() => {
        this.isServerRunning = false
        this.ListenServer = {}
      })

    }
  }

  restartListenerServer () {
    if (!this.isServerRunning) {
      runLocalServer(this.localIP, this.localPort).then((server) => {
        this.isOBFSServerRunning = true
        this.ListenServer = server
      }).catch((err) => {
        this.errorHandler(err)
      })
    } else if (this.ListenServer.address().port !== this.localIP) {
      this.stopListenServer()
      runLocalServer(this.localIP, this.localPort).then((server) => {
        this.isServerRunning = true
        this.ListenServer = server
      }).catch((err) => {
        this.errorHandler(err)
      })
    }
  }

}
var ConnectivityConnection = new CloudBasedConnectivityAPI()
export default ConnectivityConnection
