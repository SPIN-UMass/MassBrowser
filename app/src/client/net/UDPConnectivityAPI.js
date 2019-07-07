import { EventEmitter } from 'events'
import API from '@/api'
import { info, debug } from '~/utils/log'
import { runLocalUDPServer } from './incommingConnection'
import * as dgram from 'dgram'

class UDPConnectivityAPI extends EventEmitter {
  constructor () {
    super()
    this.echoServerAddress = ''
    this.echoServerPort = 0
    this.socket = null
    this.isConnected = false
    this.autoConnect = false
    this.routineStatus = false
    this.ListenServer = null
    this.isServerRunning = false
    this.localAddress = ''
    this.remoteAddress = ''
    this.localUDPPort = 0
    this.remoteUDPPort = 0
    this.keepAliveInterval = null
  }

  respHandler (localAddress, localPort, remoteAddress, remotePort) {
    if (this.localUDPPort !== localPort && this.localAddress !== localAddress && this.remoteUDPPort !== remotePort && this.remoteAddress !== remoteAddress) {
      this.localAddress = localAddress
      this.localUDPPort = localPort
      this.remoteAddress = remoteAddress
      this.remoteUDPPort = remotePort
      this.restartListenerServer()
      API.updateClientAddress(remoteAddress, null, remotePort)
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
      if (this.echoServerPort === 0) {
        API.requestNewStunServer().then((data) => {
          this.echoServerAddress = data.ip
          this.echoServerPort = data.port
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
        info('UDP socket created')
      })

      this.socket.send(Buffer.from('TEST'), this.echoServerPort, this.echoServerAddress, (err) => {
        debug('Error on sending UDP test message to Echo server', err)
        this.socket.close()
      })

      this.socket.on('message', (data, remote) => {
        data = data.toString()
        let remoteAddress = data.split(':')[0]
        let remotePort = data.split(':')[1]
        this.respHandler(this.socket.address().address, this.socket.address().port, remoteAddress, remotePort)
      })

      this.socket.on('connect', () => {
        debug('UDP Connected to Echo Server')
        this.isConnected = true
      })

      this.socket.on('close', () => {
        debug('UDP Connectivity Server Ended')
        this.isConnected = false
      })

      this.socket.on('error', (e) => {
        debug('UDP Connectivity Server Error', e)
        this.reconnect()
      })

      resolve()
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
      runLocalUDPServer(this.localAddress, this.localUDPPort).then((server) => {
        this.isOBFSServerRunning = true
        this.ListenServer = server
      }).catch((err) => {
        this.errorHandler(err)
      })
    } else if (this.ListenServer.address().port !== this.localUDPPort) {
      this.stopListenServer()
      runLocalUDPServer(this.localAddress, this.localUDPPort).then((server) => {
        this.isServerRunning = true
        this.ListenServer = server
      }).catch((err) => {
        this.errorHandler(err)
      })
    }
  }
}

let UDPConnectivityConnection = new UDPConnectivityAPI()
export default UDPConnectivityConnection
