import API from '@/api'
import config from '@utils/config'
import { relayManager } from '@/services'
import { TCPNATConnection, UDPNATConnection } from '@/net'
import { store } from '@utils/store'
import { debug } from '@utils/log'

class NetworkMonitor {
  constructor () {
    this.localTCPPort = -1
    this.remoteTCPPort = -1

    this.localUDPPort = -1
    this.remoteUDPPort = -1

    this.remoteAddress = ''
    this.localAddress = ''

    this.isTCPRelayReachable = false
    this.isUDPRelayReachable = false
    this.isServerConnected = false

    this.TCPNATConnection = null
    this.UDPNATConnection = null

    this.keepAliveInterval = null
  }

  async start () {
    this.TCPNATConnection = new TCPNATConnection(config.echoServer.host, config.echoServer.port)
    this.TCPNATConnection.on('tcp-net-update', data => this._onTCPNetworkUpdate(data))
    this.TCPNATConnection.on('close', () => { this.TCPNATConnection.reconnect() })
    await this.TCPNATConnection.connect()

    this.UDPNATConnection = new UDPNATConnection(config.echoServer.host, config.echoServer.port)
    this.UDPNATConnection.on('udp-net-update', data => this._onUDPNetworkUpdate(data))
    this.UDPNATConnection.on('error', () => { this.UDPNATConnection.reconnect() })
    await this.UDPNATConnection.connect()

    setTimeout(() => this._sendKeepAlive(), 500)
    this.keepAliveInterval = setInterval(() => this._sendKeepAlive(), config.keepAliveInterval * 1000)
  }

  waitForNetworkStatus () {
    return new Promise((resolve, reject) => {
      this.TCPNATConnection.once('tcp-net-update', data => data).then((TCPData) => {
        this.UDPNATConnection.once('udp-net-update', UDPData => resolve({TCPData, UDPData}))
      })
    })
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

    debug(`Keepalive sent, connected: ${isServerConnected}  reachable: ${isTCPRelayReachable}`)
    if (this.TCPNATConnection.isConnected) {
      this.TCPNATConnection.keepAlive()
    }
    debug(`Keepalive sent, connected: ${isServerConnected}  reachable: ${isUDPRelayReachable}`)
    this.UDPNATConnection.keepAlive()
  }

  _onTCPNetworkUpdate (data) {
    let changed = false
    data.remotePort = Number(data.remotePort)
    data.localPort = Number(data.localPort)
    for (let field of ['localIP', 'localPort', 'remoteIP', 'remotePort']) {
      changed = changed || (this[field] !== data[field])
      this[field] = data[field]
    }
    if (changed) {
      relayManager.handleReconnect()
    }
  }

  _onUDPNetworkUpdate (data) {
    let changed = false
    data.remotePort = Number(data.remotePort)
    data.localPort = Number(data.localPort)
    if (this.localUDPPort !== data.localPort || this.remoteUDPPort !== data.remotePort) {
      changed = true
      this.localUDPPort = data.localPort
      this.remoteUDPPort = data.remotePort
    }
    if (changed) {
      relayManager.handleReconnect()
    }
  }
}
export const networkMonitor = new NetworkMonitor()
export default networkMonitor
