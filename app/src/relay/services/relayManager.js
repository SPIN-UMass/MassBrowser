import { TCPRelay, ConnectionAuthenticator, ThrottleGroup } from '@/net'
import { warn, error, debug } from '@utils/log'
import API from '@/api'
import { store } from '@utils/store'
import { networkMonitor } from '@/services'
import { statusManager } from '@common/services'
import { ConnectionType, UNLIMITED_BANDWIDTH } from '@/constants'
import config from '@utils/config'


/**
 * Manages the relay server.
 * 
 * You can start/stop the relay and change upload and download
 * bandwidth limits
 */
class RelayManager {
  constructor () {
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

  changeNatStatus (natEnabled) {
    this.natEnabled = natEnabled
    store.commit('changeNatStatus', natEnabled)
    this.restartRelay()
  }

  setRelayPort (relayPort) {
    this.relayPort = relayPort
    store.commit('changeRelayPort', relayPort)
    this.restartRelay()
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

  onNewSessionEvent (data) {
    var desc = {
      'writekey': (Buffer.from(data.read_key, 'base64')),
      'writeiv': (Buffer.from(data.read_iv, 'base64')),
      'readkey': (Buffer.from(data.write_key, 'base64')),
      'readiv': (Buffer.from(data.write_iv, 'base64')),
      'token': (Buffer.from(data.token, 'base64')),
      'client': data.client,
      'connectiontype': data.connection_type,
      'sessionId': data.id
    }
  
    debug(`New session [${data.id}] received for client [${data.client.id}]`)
  
    if (desc.connectiontype === ConnectionType.TCP_CLIENT) {
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

  async _startRelayServer() {
    let localAddress = this._getLocalAddress()

    let server = new TCPRelay(
      this.authenticator,
      localAddress.ip, 
      localAddress.port,
      this.uploadLimiter,
      this.downloadLimiter
    )
    await server.start()
    this.isRelayServerRunning = true
    this.relayServer = server
  }

  async _restartRelayServer () {
    try {
      if (this.isRelayServerRunning) {
        await this._stopRelayServer() 
      } 
      await this._startRelayServer()
    } catch(err) {
      warn(err)
    }
  }

  _getReachableAddress () {
    let publicAddress = networkMonitor.getPublicAddress()

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

export const relayManager = new RelayManager()
export default relayManager
