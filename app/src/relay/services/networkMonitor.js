import API from '@/api'
import config from '@utils/config'
import { relayManager } from '@/services'
import { TCPNATConnection } from '@/net'
import { store } from '@utils/store'
import { debug } from '@utils/log'

class NetworkMonitor {
  constructor () {
    this.localPort = -1
    this.remotePort = -1
    this.remoteIP = ''
    this.localIP = ''

    this.isRelayReachable = false
    this.isServerConnected = false

    this.TCPNATConnection = null
    this.keepAliveInterval = null

    this.UDPNATConnection = null
  }

  async start () {
    let natConnection = this.TCPNATConnection = new TCPNATConnection(
      config.echoServer.host,
      config.echoServer.port
    )

    natConnection.on('net-update', data => this._onNetworkUpdate(data))
    natConnection.on('close', () => { natConnection.reconnect() })

    await natConnection.connect()

    setTimeout(() => this._sendKeepAlive(), 500)
    this.keepAliveInterval = setInterval(() => this._sendKeepAlive(), config.keepAliveInterval * 1000)
  }

  waitForNetworkStatus () {
    return new Promise((resolve, reject) => {
      this.TCPNATConnection.once('net-update', data => resolve(data))
    })
  }

  getPublicAddress () {
    return {ip: this.remoteIP, port: this.remotePort}
  }

  getPrivateAddress () {
    return {ip: this.localIP, port: this.localPort}
  }

  async _sendKeepAlive () {
    let isRelayReachable, isServerConnected
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

  _onNetworkUpdate (data) {
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
