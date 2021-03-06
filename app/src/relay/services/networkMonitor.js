import API from '@/api'
import config from '@utils/config'
import { relayManager } from '@/services'
import TCPNATConnection from '@common/net/TCPNATConnection'
import UDPNATConnection from '@common/net/UDPNATConnection'
import { store } from '@utils/store'
import { warn, info } from '@utils/log'
import udpConnectionService from '@common/services/UDPConnectionService'

class NetworkMonitor {
  constructor () {
    this.localTCPPort = -1
    this.remoteTCPPort = -1
    this.localUDPPort = -1
    this.remoteUDPPort = -1
    this.NATInfoChanged = false
    this.remoteAddress = ''
    this.localAddress = ''
    this.isTCPRelayReachable = false
    this.isUDPRelayReachable = false
    this.isServerConnected = false
    this.TCPNATConnection = null
    this.UDPNATConnection = null
    this.keepAliveInterval = null
    this.isUDPNATRoutineRunning = false
    console.log("Network manager Loaded!")
  }

  async start () {
    await udpConnectionService.start(true).then(() => relayManager.isUDPRelayServerRunning = true)
    this.TCPNATConnection = new TCPNATConnection(config.echoServer.host, config.echoServer.port)
    this.TCPNATConnection.on('tcp-net-update', data => this._onTCPNetworkUpdate(data))
    this.TCPNATConnection.on('close', () => { this.TCPNATConnection.reconnect() })
    await this.TCPNATConnection.connect()

    let udpStunServer = await API.requestNewUDPStunServer()
    this.UDPNATConnection = new UDPNATConnection(udpStunServer.ip, udpStunServer.port)
    this.UDPNATConnection.on('udp-net-update', data => this._onUDPNetworkUpdate(data))
    this.UDPNATConnection.on('error', () => { this.UDPNATConnection.reconnect() })
    udpConnectionService.on('start', () => {
      this.UDPNATConnection.reconnect()
    })
    await this.UDPNATConnection.connect().then(() => {
      this.isUDPNATRoutineRunning = true
    })

    setTimeout(() => this._sendKeepAlive(), 500)
    this.keepAliveInterval = setInterval(() => this._sendKeepAlive(), config.keepAliveInterval * 1000)
  }

  stopUDPNATRoutine () {
    if (this.isUDPNATRoutineRunning) {
      this.isUDPNATRoutineRunning = false
      this.UDPNATConnection.stop()
    }
  }

  async startUDPNATRoutine () {
    await this.UDPNATConnection.connect().then(() => {
      this.isUDPNATRoutineRunning = true
    })
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

  getPublicAddress () {
    return {ip: this.remoteAddress, port: this.remoteTCPPort, UDPPort: this.remoteUDPPort}
  }

  getPrivateAddress () {
    return {ip: this.localAddress, port: this.localTCPPort, UDPPort: this.localUDPPort}
  }

  async _sendKeepAlive () {
    let isTCPRelayReachable
    let isUDPRelayReachable
    let isServerConnected
    try {
      let res = await API.keepAlive(relayManager.openAccess)
      isServerConnected = true
      isTCPRelayReachable = res.data.tcp_reachable
      isUDPRelayReachable = res.data.udp_reachable
    } catch (err) {
      isTCPRelayReachable = false
      isUDPRelayReachable = false
      isServerConnected = false
    }

    if (isServerConnected !== this.isServerConnected) {
      this.isServerConnected = isServerConnected
      store.commit('changeServerConnected', isServerConnected)
    }

    if (isTCPRelayReachable !== this.isTCPRelayReachable) {
      this.isTCPRelayReachable = isTCPRelayReachable
      store.commit('changeTCPRelayReachable', isTCPRelayReachable)
    }

    if (isUDPRelayReachable !== this.isUDPRelayReachable) {
      this.isUDPRelayReachable = isUDPRelayReachable
      store.commit('changeUDPRelayReachable', isUDPRelayReachable)
    }

    info(`TCP Keepalive sent, connected: ${isServerConnected}  reachable: ${isTCPRelayReachable}`)
    if (this.TCPNATConnection.isConnected) {
      this.TCPNATConnection.keepAlive()
    }
    info(`UDP Keepalive sent, connected: ${isServerConnected}  reachable: ${isUDPRelayReachable}`)
    if (this.isUDPNATRoutineRunning) {
      this.UDPNATConnection.keepAlive()
    }
  }

  _onTCPNetworkUpdate (data) {
    if (this.localTCPPort !== data.localTCPPort || this.remoteTCPPort !== data.remoteTCPPort) {
      this.NATInfoChanged = true
      this.localAddress = data.localAddress
      this.remoteAddress = data.remoteAddress
      this.localTCPPort = data.localTCPPort
      this.remoteTCPPort = data.remoteTCPPort
    }
    if (this.NATInfoChanged && this.remoteUDPPort !== -1) {
      this.NATInfoChanged = false
      relayManager.handleReconnect()
    }
  }

  _onUDPNetworkUpdate (data) {
    if (this.localUDPPort !== data.localUDPPort || this.remoteUDPPort !== data.remoteUDPPort) {
      this.NATInfoChanged = true
      this.localAddress = data.localAddress
      this.remoteAddress = data.remoteAddress
      this.localUDPPort = data.localUDPPort
      this.remoteUDPPort = data.remoteUDPPort
    }
    if (this.NATInfoChanged && this.remoteTCPPort !== -1 && this.remoteUDPPort !== -1) {
      this.NATInfoChanged = false
      relayManager.handleReconnect()
    }
  }
}
export const networkMonitor = new NetworkMonitor()
export default networkMonitor
