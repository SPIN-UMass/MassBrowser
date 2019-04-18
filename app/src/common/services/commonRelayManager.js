import { TCPRelay, ConnectionAuthenticator, ThrottleGroup } from '@common/net'
import { warn, error, debug } from '@utils/log'
import API from '@/api'
import { store } from '@utils/store'
import { networkMonitor } from '@common/services/networkMonitor'
//import { networkMonitor } from '@/services'
import { statusManager } from '@common/services'
import { ConnectionType, UNLIMITED_BANDWIDTH } from '@common/constants'
import config from '@utils/config'


/**
 * Manages the relay server.
 * 
 * You can start/stop the relay and change upload and download
 * bandwidth limits
 */
export class CommonRelayManager {
  constructor () {
    console.log("Creating CommonRelayManager")

    this.relayServer = null
    this.isRelayServerRunning = false

    this.openAccess = false

    store.ready.then(() => {
      this.natEnabled = store.state.natEnabled
      this.relayPort = store.state.relayPort
  
      this.uploadLimit = store.state.uploadLimit
      this.downloadLimit = store.state.downloadLimit
      this.bandwidthLimited = this.uploadLimit !== 0 || this.downloadLimit !== 0
      this.uploadLimiter = ThrottleGroup({rate: this.uploadLimit || UNLIMITED_BANDWIDTH})
      this.downloadLimiter = ThrottleGroup({rate: this.downloadLimit || UNLIMITED_BANDWIDTH})
  
      this.authenticator = new ConnectionAuthenticator()     
      
      // Needed for TCPRelay to use correct API
      this.is_relay_client = false
  
      if (this.natEnabled) {
        debug('NAT mode is enabled')
      } else {
        debug(`NAT mode is not enabled, running relay on port: ${this.relayPort}`)
      }   
    })
    
  }

  setUploadLimit (limitBytes) {
    this.uploadLimit = limitBytes * 8
    store.commit('changeUploadLimit', limitBytes)
    this.uploadLimiter.resetRate({rate: this.uploadLimit || UNLIMITED_BANDWIDTH})
  }

  setDownloadLimit (limitBytes) {
    this.downloadLimit = limitBytes * 8
    store.commit('changeDownloadLimit', limitBytes)
    this.downloadLimiter.resetRate({rate: this.downloadLimit || UNLIMITED_BANDWIDTH})
  }

  changeNatStatus (natEnabled, restartRelay=true) {
    this.natEnabled = natEnabled
    store.commit('changeNatStatus', natEnabled)
    if (restartRelay) {
      this.restartRelay()
    }    
  }

  setRelayPort (relayPort, restartRelay=true) {
    this.relayPort = relayPort
    store.commit('changeRelayPort', relayPort)
    if (restartRelay) {
      this.restartRelay()      
    }    
  }

  async changeAccess (access) {
    if (access === this.openAccess) {
      return
    }

    this.openAccess = access
    store.commit('changeOpenAccess', this.openAccess)

    if (this.openAccess) {
      let publicaddress = this._getReachableAddress()
      API.relayUp(publicaddress.ip, publicaddress.port)
      await this._restartRelayServer()
      statusManager.info(`Relay server started on port ${publicaddress.port}`, { timeout: true })
    } else {
      API.relayDown()
      await this._stopRelayServer()
    }
  }

  // this is called from boot.js as well
  async startRelay() {
    await this.changeAccess(true)
  }

  async stopRelay() {
    await this.changeAccess(false)
  }

  async restartRelay() {
    const status = statusManager.info('Restarting relay server...')
    await this.stopRelay()
    await this.startRelay()
    status.clear()
  }

  handleReconnect () {
    if (this.openAccess) {
      debug(this.openAccess)
      let publicaddress = this._getReachableAddress()
      API.relayUp(publicaddress.ip, publicaddress.port)
      this._restartRelayServer()
    }
  }

  // called by events.js
  // Authenticator behaves similar to RelayConnection.js on client side.
  // not used by client, I think
  onNewSessionEvent (data) {
    var desc = {
      'writekey': (Buffer.from(data.read_key, 'base64')),
      'writeiv': (Buffer.from(data.read_iv, 'base64')),
      'readkey': (Buffer.from(data.write_key, 'base64')),
      'readiv': (Buffer.from(data.write_iv, 'base64')),
      'token': (Buffer.from(data.token, 'base64')),
      'client': data.client,
      'connectionType': data.connection_type,
      'sessionId': data.id
    }
  
    debug(`New session [${data.id}] received for client [${data.client.id}]`)
  
    if (desc.connectionType === ConnectionType.TCP_CLIENT) {
      this.authenticator.addPendingConnection((desc.token), desc)
    }

    API.acceptSession(data.client, data.id)
  }

  async _stopRelayServer() {
    if (this.isRelayServerRunning) {
      await this.relayServer.stop()
      this.isRelayServerRunning = false
      this.relayServer = null
    }
  }
  
  // called on startup and restart
  async _startRelayServer() {
    let localAddress = this._getLocalAddress()

    // only TCPRelay started at the moment.
    let server = new TCPRelay(
      this.authenticator,
      localAddress.ip, 
      localAddress.port,
      this.uploadLimiter,
      this.downloadLimiter,
      this.is_relay_client
    )
    await server.start()
    this.isRelayServerRunning = true
    this.relayServer = server
  }
  
  async _restartRelayServer () {
    try {
      if (this.isRelayServerRunning) {
        await this._stopRelayServer() 
        debug(`Relay stopped`)
      } 
      await this._startRelayServer()
      debug(`Relay started`)
    } catch(err) {
      warn(err)
    }
  }

  _getReachableAddress () {
    //console.log("Calling getPublicAddress()")
    let publicAddress = networkMonitor.getPublicAddress()
    console.log("GOT PUBLIC ADDRESS from getPublicAddress(): " + publicAddress.ip + ":" + publicAddress.port)

    store.commit('changePublicAddress', publicAddress)

    if (this.natEnabled) {
      return {ip: publicAddress.ip, port: publicAddress.port}
    }
    return {ip: publicAddress.ip, port: this.relayPort}
  }

  _getLocalAddress () {
    let privateAddress = networkMonitor.getPrivateAddress()
    
    store.commit('changePrivateAddress', privateAddress)

    if (this.natEnabled) {
      return {ip: privateAddress.ip, port: privateAddress.port}
    }
    return {ip: '0.0.0.0', port: this.relayPort}
  }
}

export default CommonRelayManager