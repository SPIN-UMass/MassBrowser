import UDPNATConnection from '@common/net/UDPNATConnection'
import TCPNATConnection from '@common/net/TCPNATConnection'
import { debug, warn } from '@utils/log'
import API from '@/api'
const net = require('net')
import { TCPRelayConnection } from './TCPRelayConnection'
import udpConnectionService from '@common/services/UDPConnectionService'

class NetworkManager {
  constructor () {
    this.NATInfoChanged = false
    this.localTCPPort = -1
    this.remoteTCPPort = -1
    this.localUDPPort = -1
    this.remoteUDPPort = -1
    this.remoteSecondUDPPort = -1

    this.localAddress = ''
    this.remoteAddress = ''

    this.UDPNATPunchingList = {}
    this.UDPNATConnection = null
    this.TCPNATConnection = null

    this.keepAliveInterval = null

    this.isTCPNATRoutineRunning = false
    this.isUDPNATRoutineRunning = false

    this.listenerServer = {}
    this.isServerRunning = false
  }

  startTCPNATRoutine () {
    this.isTCPNATRoutineRunning = true
  }

  stopTCPNATRoutine () {
    this.isTCPNATRoutineRunning = false
  }

  startUDPNATRoutine () {
    // TODO
    this.isUDPNATRoutineRunning = true
  }

  stopUDPNATRoutine () {
    if (this.isUDPNATRoutineRunning) {
      this.isUDPNATRoutineRunning = false
      this.UDPNATConnection.stop()
    }
  }

  getLocalUDPPort () {
    return this.localUDPPort
  }

  getLocalAddress () {
    return this.localAddress
  }

  getLocalTCPPort () {
    return this.localTCPPort
  }

  _sendKeepAlive () {
    if (this.isTCPNATRoutineRunning) {
      this.TCPNATConnection.keepAlive()
    }

    if (this.isUDPNATRoutineRunning) {
      this.UDPNATConnection.keepAlive()
    }
  }

  waitForNetworkStatus () {
    const TCPNATPromise = new Promise((resolve, reject) => {
      this.TCPNATConnection.once('tcp-net-update', data => {
        resolve()
      })
    })
    const UDPNATPromise = new Promise((resolve, reject) => {
      this.UDPNATConnection.once('udp-net-update', data => {
        resolve()
      })
    })
    return Promise.all([TCPNATPromise, UDPNATPromise])
  }

  async start () {
    await udpConnectionService.start()
    let echoServer = await API.requestNewStunServer()
    this.TCPNATConnection = new TCPNATConnection(echoServer.ip, echoServer.port)
    this.TCPNATConnection.on('tcp-net-update', data => { this._onTCPNetworkUpdate(data) })
    this.TCPNATConnection.on('close', () => { this.TCPNATConnection.reconnect() })
    await this.TCPNATConnection.connect().then(() => {
      this.startTCPNATRoutine()
    })

    let udpStunServer = await API.requestNewUDPStunServer()
    this.UDPNATConnection = new UDPNATConnection(udpStunServer.ip, udpStunServer.port)
    this.UDPNATConnection.on('udp-net-update', data => { this._onUDPNetworkUpdate(data) })
    await this.UDPNATConnection.connect().then(() => {
      this.startUDPNATRoutine()
    })

    setTimeout(() => this._sendKeepAlive(), 500)
    this.keepAliveInterval = setInterval(() => this._sendKeepAlive(), 15000)
  }

  _onTCPNetworkUpdate (data) {
    if (this.localTCPPort !== data.localTCPPort || this.remoteTCPPort !== data.remoteTCPPort) {
      this.NATInfoChanged = true
      this.localAddress = data.localAddress
      this.remoteAddress = data.remoteAddress
      this.localTCPPort = data.localTCPPort
      this.remoteTCPPort = data.remoteTCPPort
    }
    if (this.NATInfoChanged && this.remoteSecondUDPPort !== -1 && this.remoteUDPPort !== -1) {
      this.NATInfoChanged = false
      // this.restartListenerServer()
      API.updateClientAddress(this.remoteAddress, this.remoteTCPPort, this.remoteUDPPort, this.remoteSecondUDPPort)
    }
  }

  _onUDPNetworkUpdate (data) {
    if (this.localUDPPort !== data.localUDPPort || this.remoteUDPPort !== data.remoteUDPPort || this.remoteSecondUDPPort !== data.remoteSecondUDPPort) {
      this.NATInfoChanged = true
      this.localAddress = data.localAddress
      this.remoteAddress = data.remoteAddress
      this.localUDPPort = data.localUDPPort
      this.remoteUDPPort = data.remoteUDPPort
      this.remoteSecondUDPPort = data.remoteSecondUDPPort
    }
    if (this.NATInfoChanged && this.remoteTCPPort !== -1 && this.remoteSecondUDPPort !== -1 && this.remoteUDPPort !== -1) {
      this.NATInfoChanged = false
      debug(this.remoteAddress, this.remoteTCPPort, this.remoteUDPPort, this.remoteSecondUDPPort)
      API.updateClientAddress(this.remoteAddress, this.remoteTCPPort, this.remoteUDPPort, this.remoteSecondUDPPort)
    }
  }

  stopListenServer () {
    if (this.isServerRunning) {
      this.listenerServer.close(() => {
        this.isServerRunning = false
        this.listenerServer = {}
      })
    }
  }

  runLocalTCPServer (publicIP, publicPort) {
    return new Promise((resolve, reject) => {
      const server = net.createServer((socket) => {
        let receiver = new TCPRelayConnection()
        receiver.relayReverse(socket)
        socket.on('error', (err) => {
          debug('Local TCP Server error: ', err)
          receiver.end()
        })
        socket.on('end', () => {
          receiver.end()
        })
      })
      server.listen({port: publicPort, host: '0.0.0.0', exclusive: false}, () => {
        resolve(server)
      })
      debug('TCP Relay started on ', publicPort)
      server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
          warn('TCP Relay address in use, retrying...')
          setTimeout(() => {
            server.close()
            server.listen({port: publicPort, host: '0.0.0.0', exclusive: false}, () => {
              resolve(server)
            })
          }, 1000)
        }
      })
    })
  }

  restartListenerServer () {
    if (!this.isServerRunning) {
      this.runLocalTCPServer(this.localAddress, this.localTCPPort).then((server) => {
        this.isOBFSServerRunning = true
        this.listenerServer = server
      }).catch((err) => {
        debug(err)
      })
    } else if (this.listenerServer.localPort !== this.localTCPPort) {
      this.stopListenServer()
      this.runLocalTCPServer(this.localAddress, this.localTCPPort).then((server) => {
        this.isServerRunning = true
        this.listenerServer = server
      }).catch((err) => {
        debug(err)
      })
    }
  }
}

let networkManager = new NetworkManager()

export default networkManager
