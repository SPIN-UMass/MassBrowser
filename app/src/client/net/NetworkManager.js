import UDPNATConnection from './UDPNATConnection'
import TCPNATConnection from './TCPNATConnection'
import * as dgram from 'dgram'
import { debug, warn } from '@utils/log'
import API from '@/api'
const net = require('net')
import * as rudp from '@common/rudp'
import { TCPRelayConnection } from './TCPRelayConnection'

class NetworkManager {
  constructor () {
    this.localTCPPort = -1
    this.remoteTCPPort = -1
    this.localUDPPort = -1
    this.remoteUDPPort = -1

    this.localAddress = ''
    this.remoteAddress = ''

    this.isNatPunched = false
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
    let TCPEchoServer = await API.requestNewStunServer()
    this.TCPNATConnection = new TCPNATConnection(TCPEchoServer.ip, TCPEchoServer.port)
    this.TCPNATConnection.on('tcp-net-update', data => { this._onTCPNetworkUpdate(data) })
    this.TCPNATConnection.on('close', () => { this.TCPNATConnection.reconnect() })
    await this.TCPNATConnection.connect().then(() => {
      this.startTCPNATRoutine()
    })

    this.UDPNATConnection = new UDPNATConnection('128.119.245.46', 8823)
    this.UDPNATConnection.on('udp-net-update', data => { this._onUDPNetworkUpdate(data) })
    await this.UDPNATConnection.connect().then(() => {
      this.startUDPNATRoutine()
    })

    setTimeout(() => this._sendKeepAlive(), 500)
    this.keepAliveInterval = setInterval(() => this._sendKeepAlive(), 5 * 1000) // what is the interval?
  }

  performUDPHolePunching (address, port) {
    return new Promise((resolve, reject) => {
      console.log('punching')
      this.stopUDPNATRoutine()
      let socket = dgram.createSocket({type: 'udp4', reuseAddr: true})
      socket.bind({
        port: this.localUDPPort,
        address: this.localAddress,
        exclusive: false
      })
      let client = new rudp.Client(socket, address, port)
      let holePunchingInterval = setInterval(() => {
        warn('sending hello')
        client.send(Buffer.from('HELLO'))
      }, 5000)

      client.on('data', (data) => {
        if (data.toString() === 'HELLO') {
          this.isNatPunched = true
          clearInterval(holePunchingInterval)
          client.close()
          resolve()
        }
      })

      socket.on('close', () => {
        warn('close called!')
      })

      socket.on('error', err => {
        warn('Socket error happened while performing udp punching: ', err)
      })
    })
  }

  _onTCPNetworkUpdate (data) {
    let changed = false
    if (this.localTCPPort !== data.localTCPPort || this.remoteTCPPort !== data.remoteTCPPort) {
      changed = true
      this.localAddress = data.localAddress
      this.remoteAddress = data.remoteAddress
      this.localTCPPort = data.localTCPPort
      this.remoteTCPPort = data.remoteTCPPort
    }
    if (changed) {
      this.restartListenerServer()
      API.updateClientAddress(this.remoteAddress, this.remoteTCPPort, this.remoteUDPPort)
    }
  }

  _onUDPNetworkUpdate (data) {
    let changed = false
    if (this.localUDPPort !== data.localUDPPort || this.remoteUDPPort !== data.remoteUDPPort) {
      changed = true
      this.localAddress = data.localAddress
      this.remoteAddress = data.remoteAddress
      this.localUDPPort = data.localUDPPort
      this.remoteUDPPort = data.remoteUDPPort
    }
    if (changed) {
      API.updateClientAddress(this.remoteAddress, this.remoteTCPPort, this.remoteUDPPort)
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

// stopLocalUDPServer () {
//   if (this.isUDPServerRunning) {
//     this.listenerServer.close()
//     this.isServerRunning = false
//     this.listenerServer = null
//   }
// }

// restartLocalUDPServer () {
//   if (!this.isServerRunning) {
//     this.startLocalUDPServer(this.localAddress, this.localUDPPort).then((server) => {
//       this.listenerServer = server
//     }).catch((err) => {
//       warn(err)
//     })
//   } else if (this.listenerServer.address().port !== this.localUDPPort) {
//     this.stopLocalUDPServer()
//     this.startLocalUDPServer(this.localAddress, this.localUDPPort).then((server) => {
//       this.isServerRunning = true
//       this.listenerServer = server
//     }).catch((err) => {
//       warn(err)
//     })
//   }
// }

// startLocalUDPServer (publicAddress, publicPort) {
//   return new Promise((resolve, reject) => {
//     let socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
//     let server = new rudp.Server(socket)
//
//     socket.bind({ port: publicPort, address: publicAddress, exclusive: false }, () => {
//       debug('UDP Relay started on ', publicPort)
//     })
//
//     socket.on('error', err => {
//       debug('UDP Relay socket error, ', err)
//       if (err.code === 'EADDRINUSE') {
//         warn('UDP Relay address in use, retrying...')
//         setTimeout(() => {
//           socket.close()
//           socket.bind({ port: publicPort, address: publicAddress, exclusive: false }, () => {
//             debug('UDP Relay started on ', publicPort)
//             resolve(socket)
//           })
//           server = new rudp.Server(socket)
//         }, 1000)
//       }
//     })
//
//     server.on('connection', connection => {
//       let receiver = new UDPRelayConnection()
//       receiver.relayReverse(connection)
//       connection.on('error', (err) => {
//         debug('Local UDP Server error: ', err)
//         receiver.end()
//       })
//       connection.on('end', () => {
//         receiver.end()
//       })
//     })
//     resolve(socket)
//   })
// }
}

let networkManager = new NetworkManager()

export default networkManager
