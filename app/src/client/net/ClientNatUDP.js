import { EventEmitter } from 'events'
import API from '@/api'
import { debug } from '~/utils/log'
import { runLocalUDPServer } from './incommingUDPConnection'
import * as dgram from 'dgram'

class ClientNatUDP extends EventEmitter {
  constructor () {
    super()
    this.server = ''
    this.port = 0
    this.socket = undefined
    this.isConnected = false
    this.autoConnect = false
    this.routineStatus = false
    this.ListenServer = null
    this.localIP = ''
    this.isServerRunning = false
    this.remoteIP = ''
    this.localPort = 0
    this.remotePort = 0

    this.keepAliveInterval = null
  }

  respHandler (localIP, localPort, remoteIP, remotePort) {
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

  // TODO run stun server on serverURL
  checkStunServer () {
    return new Promise((resolve, reject) => {
      if (this.port === 0) {
        API.requestNewUDPStunServer().then((data) => {
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
      this.socket.send(new Buffer('TEST'))
    })
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket('udp4')
      this.socket.bind({
        port: 10000 + Math.floor(Math.random() * (65535 - 10000))
      }, () => {
        debug('udp socket created')
      })

      this.socket.connect(this.port, this.server, () => {
        this.socket.send(new Buffer('TEST'), (err) => {
          debug('error on sending test message', err)
          this.socket.close()
        })
        resolve()
      })

      this.socket.on('message', (data, remote) => {
        data = data.toString()
        let ip = data.split(':')[0]
        let port = data.split(':')[1]
        this.respHandler(this.socket.address().address, this.socket.address().port, ip, port)
      })

      this.socket.on('connect', () => {
        debug('Connected to Echo Server')
        this.isConnected = true
      })

      this.socket.on('close', () => {
        debug('Connectivity Server Ended')
        this.isConnected = false
      })

      this.socket.on('error', (e) => {
        debug('Connectivity Server Error', e)
        this.reconnect()
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
      this.ListenServer.close()
      this.isServerRunning = false
      this.ListenServer = null
    }
  }

  restartListenerServer () {
    if (!this.isServerRunning) {
      runLocalUDPServer(this.localIP, this.localPort).then((server) => {
        this.isOBFSServerRunning = true
        this.ListenServer = server
      }).catch((err) => {
        this.errorHandler(err)
      })
    } else if (this.ListenServer.address().port !== this.localPort) {
      this.stopListenServer()
      runLocalUDPServer(this.localIP, this.localPort).then((server) => {
        this.isServerRunning = true
        this.ListenServer = server
      }).catch((err) => {
        this.errorHandler(err)
      })
    }
  }
}

let ClientNatUDPObj = new ClientNatUDP()
export default ClientNatUDPObj
