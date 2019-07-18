import UDPNATConnection from './UDPNATConnection'
import * as dgram from 'dgram'
import { debug, info, warn } from '@utils/log'
import API from '@/api'

class UDPNetworkManager {
  constructor () {
    this.localUDPPort = ''
    this.localAddress = ''
    this.remoteAddress = ''
    this.remoteUDPPort = ''
    this.socket = null
    this.isNatPunched = false
    this.UDPNATConnection = null
    this.keepAliveInterval = null
    this.isUDPNATRoutineRunning = false
  }

  startUDPNATRoutine () {
    this.isUDPNATRoutineRunning = true
  }

  stopUDPNATRoutine () {
    this.isUDPNATRoutineRunning = false
    this.UDPNATConnection.stop()
  }

  getLocalUDPPort () {
    return this.localUDPPort
  }

  getLocalAddress () {
    return this.localAddress
  }

  _sendKeepAlive () {
    if (this.isUDPNATRoutineRunning) {
      this.UDPNATConnection.keepAlive()
      info('UDP Keepalive sent')
    }
  }

  async start () {
    this.UDPNATConnection = new UDPNATConnection('128.119.245.46', 8823)
    await this.UDPNATConnection.connect().then(() => {
      this.startUDPNATRoutine()
    })
    this.UDPNATConnection.on('udp-net-update', data => { this._onUDPNetworkUpdate(data) })
    setTimeout(() => this._sendKeepAlive(), 500)
    this.keepAliveInterval = setInterval(() => this._sendKeepAlive(), 30 * 1000)
  }

  performUDPHolePunching (address, port) {
    debug(`performing punching for ${address}:${port}`)
    return new Promise((resolve, reject) => {
      if (!address || port === 0) {
        reject()
      }
      this.stopUDPNATRoutine()
      let socket = dgram.createSocket({type: 'udp4', reuseAddr: true})
      socket.bind({
        port: this.localUDPPort,
        address: this.localAddress,
        exclusive: false
      })
      let holePunchingInterval = setInterval(() => {
        socket.send(Buffer.from('HELLO'), port, address)
      }, 1000)

      socket.on('message', (data, remote) => {
        if (remote.address === address && remote.port === port) {
          if (data.toString() === 'HELLO') {
            this.isNatPunched = true
            clearInterval(holePunchingInterval)
            socket.close()
            resolve()
          }
        }
      })

      socket.on('error', err => {
        warn('Socket error happened while performing udp punching: ', err)
      })
    })
  }

  _onUDPNetworkUpdate (data) {
    let changed = false
    if (this.localUDPPort !== data.localUDPPort || this.remoteUDPPort !== data.remoteUDPPort) {
      changed = true
      this.localAddress = data.localAddress
      this.remoteAddress = data.remoteAddress
      this.localUDPPort = Number(data.localUDPPort)
      this.remoteUDPPort = Number(data.remoteUDPPort)
    }
    if (changed) {
      API.updateClientAddress(this.remoteAddress, 12123, this.remoteUDPPort)
    }
  }

  // stopLocalUDPServer () {
  //   if (this.isUDPServerRunning) {
  //     this.ListenServer.close()
  //     this.isServerRunning = false
  //     this.ListenServer = null
  //   }
  // }

  // restartLocalUDPServer () {
  //   if (!this.isServerRunning) {
  //     this.startLocalUDPServer(this.localAddress, this.localUDPPort).then((server) => {
  //       this.ListenServer = server
  //     }).catch((err) => {
  //       warn(err)
  //     })
  //   } else if (this.ListenServer.address().port !== this.localUDPPort) {
  //     this.stopLocalUDPServer()
  //     this.startLocalUDPServer(this.localAddress, this.localUDPPort).then((server) => {
  //       this.isServerRunning = true
  //       this.ListenServer = server
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

let udpNetworkManager = new UDPNetworkManager()

export default udpNetworkManager
