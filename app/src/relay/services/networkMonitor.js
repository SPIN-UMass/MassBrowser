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

    this.isRelayReachable = false
    this.isServerConnected = false

    this.TCPNATConnection = null
    this.TCPKeepAliveInterval = null

    this.UDPKeepAliveInterval = null
    this.UDPNATConnection = null
  }

  async start () {
    this.TCPNATConnection = new TCPNATConnection(config.echoServer.host, config.echoServer.port)
    this.TCPNATConnection.on('tcp-net-update', data => this._onTCPNetworkUpdate(data))
    this.TCPNATConnection.on('close', () => { this.TCPNATConnection.reconnect() })
    await this.TCPNATConnection.connect()
    setTimeout(() => this._sendTCPKeepAlive(), 500)
    this.TCPKeepAliveInterval = setInterval(() => this._sendTCPKeepAlive(), config.keepAliveInterval * 1000)

    this.UDPNATConnection = new UDPNATConnection(config.echoServer.host, config.echoServer.port)
    this.UDPNATConnection.on('udp-net-update', data => this._onUDPNetworkUpdate(data))
    this.UDPNATConnection.on('error', () => { this.UDPNATConnection.reconnect() })
    await this.UDPNATConnection.connect()
    setTimeout(() => this._sendUDPKeepAlive(), 500)
    this.UDPKeepAliveInterval = setInterval(() => this._sendUDPKeepAlive(), config.keepAliveInterval * 1000)
  }

  waitForNetworkStatus () {
    return new Promise((resolve, reject) => {
      this.TCPNATConnection.once('tcp-net-update', data => resolve(data))
      this.UDPNATConnection.once('udp-net-update', data => resolve(data)) //wtf?
    })
  }

  getPublicAddress () {
    return {ip: this.remoteAddress, port: this.remoteTCPPort}
  }

  getPrivateAddress () {
    return {ip: this.localAddress, port: this.localTCPPort}
  }

  async _sendUDPKeepAlive () {
    // let isRelayReachable
    // let isServerConnected
    // try {
    //   let res = await API.keepAlive(relayManager.openAccess)
    //   isServerConnected = true
    //   isRelayReachable = res.data.tcp_reachable
    // } catch (err) {
    //   isRelayReachable = false
    //   isServerConnected = false
    // }
    //
    // if (isServerConnected !== this.isServerConnected) {
    //   this.isServerConnected = isServerConnected
    //   store.commit('changeServerConnected', isServerConnected)
    // }
    //
    // if (isRelayReachable !== this.isRelayReachable) {
    //   this.isRelayReachable = isRelayReachable
    //   store.commit('changeRelayReachable', isRelayReachable)
    // }
    //
    // debug(`Keepalive sent, connected: ${isServerConnected}  reachable: ${isRelayReachable}`)
    // if (this.TCPNATConnection.isConnected) {
    //   this.TCPNATConnection.keepAlive()
    // }
  }

  async _sendTCPKeepAlive () {
    let isRelayReachable
    let isServerConnected
    try {
      let res = await API.keepAlive(relayManager.openAccess)
      isServerConnected = true
      isRelayReachable = res.data.tcp_reachable
    } catch (err) {
      isRelayReachable = false
      isServerConnected = false
    }

    if (isServerConnected !== this.isServerConnected) {
      this.isServerConnected = isServerConnected
      store.commit('changeServerConnected', isServerConnected)
    }

    if (isRelayReachable !== this.isRelayReachable) {
      this.isRelayReachable = isRelayReachable
      store.commit('changeRelayReachable', isRelayReachable)
    }

    debug(`Keepalive sent, connected: ${isServerConnected}  reachable: ${isRelayReachable}`)
    if (this.TCPNATConnection.isConnected) {
      this.TCPNATConnection.keepAlive()
    }
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

  // checkNatType() {
  //   var stun = require('vs-stun')
  //   if (this.natEnabled) {
  //     stun.connect(config.stunServer, (err, data) => {
  //       console.log('NAT TYPE IS', data.stun)
  //     })
  //   }
  // }
}
export const networkMonitor = new NetworkMonitor()
export default networkMonitor
