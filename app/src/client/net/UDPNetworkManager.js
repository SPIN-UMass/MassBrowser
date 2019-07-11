import UDPConnectivityConnection from './UDPConnectivityAPI'
import * as dgram from 'dgram'
import { debug, warn } from '@utils/log'
import API from '@/api'

class UDPNetworkManager {
  constructor () {
    this.connected = false
    this.localUDPPort = ''
    this.localAddress = ''
    this.remoteAddress = ''
    this.remoteUDPPort = ''
    this.isUDPServerRunning = false
    this.isConnectivityActive = false
    this.socket = null
    this.isNatPunched = false

    UDPConnectivityConnection.on('udp-net-update', (natInfo) => {
      if (this.localUDPPort !== natInfo.localUDPPort && this.localAddress !== natInfo.localAddress && this.remoteUDPPort !== natInfo.remoteUDPPort && this.remoteAddress !== natInfo.remoteAddress) {
        this.localAddress = natInfo.localAddress
        this.localUDPPort = natInfo.localUDPPort
        this.remoteUDPPort = natInfo.remoteUDPPort
        this.remoteAddress = natInfo.remoteAddress
      }
      // this.restartLocalUDPServer()
      API.updateClientAddress(this.remoteAddress, null, this.remoteUDPPort)
    })
  }

  getLocalUDPPort () {
    return this.localUDPPort
  }

  getLocalAddress () {
    return this.localAddress
  }

  async start () {
    await UDPConnectivityConnection.startRoutine().then(() => {
      this.isConnectivityActive = true
    })
  }

  stopConnectivity () {
    UDPConnectivityConnection.stopRoutine()
    this.isConnectivityActive = false
  }

  performUDPHolePunching (address, port) {
    return new Promise((resolve, reject) => {
      UDPConnectivityConnection.stopRoutine()
      let socket = dgram.createSocket({type: 'udp4', reuseAddr: true})
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
