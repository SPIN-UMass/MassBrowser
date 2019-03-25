import API from '@/api'
import config from '@utils/config'
import { clientRelayManager } from '@/services'
import { NATConnectivityConnection } from '@common/net'
//import { relayManager } from '@/services'
//import { NATConnectivityConnection } from '@/net'
import { store } from '@utils/store'
import { debug } from '@utils/log'

// TODO make clientRelayManager vs relayManager dynamically switchable. 
// the current global constant concept seems to be unsuitable
// maybe set reference in constructor instead. 
class NetworkMonitor {
  constructor () {
    console.log("Creating NetworkMonitor")
    //console.log(config)
    console.log("EchoServer: " + config.echoServer.host + " - " + config.echoServer.port)
    this.localPort = -1
    this.remotePort = -1
    this.remoteIP = ''
    this.localIP = ''

    this.isRelayReachable = false
    this.isServerConnected = false

    this.natConnection = null
    this.keepAliveInterval = null
  }

  async start () {
    console.log("EchoServer config: ", config.echoServer.host, config.echoServer.port)
    let natConnection = this.natConnection = new NATConnectivityConnection(
      config.echoServer.host,
      config.echoServer.port
    )

    natConnection.on('net-update', data => this._onNetworkUpdate(data))
    natConnection.on('close', () => { natConnection.reconnect() })
    
    console.log("STARTING natConnection.connect()")
    await natConnection.connect()
    console.log("DO I GET AFTER natConnection.connect()??")

    setTimeout(() => this._sendKeepAlive(), 500)
    this.keepAliveInterval = setInterval(() => this._sendKeepAlive(), config.keepAliveInterval * 1000)
  }

  waitForNetworkStatus () {
    return new Promise((resolve, reject) => {
      this.natConnection.once('net-update', data => resolve(data))
    })
  }

  getPublicAddress () {
    console.log("\n\n getPublicAddress(): Do I get here?\n")
    return {ip: this.remoteIP, port: this.remotePort}
  }

  getPrivateAddress () {
    return {ip: this.localIP, port: this.localPort}
  }

  async _sendKeepAlive () {
    let isRelayReachable, isServerConnected
    
    try {
      let res = await API.keepAlive(clientRelayManager.openAccess)
      isServerConnected = true
      isRelayReachable = res.data.tcp_reachable
    } catch(err) {
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

    if (this.natConnection.isConnected) {
      this.natConnection.keepAlive()
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
      clientRelayManager.handleReconnect()
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
