import { ThrottleGroup } from '@/net/throttle'
import { runOBFSserver } from '@/net/OBFSReceiver'
import { error, debug } from '@utils/log'
import API from '@/api'
import { store } from '@utils/store'
import { networkMonitor } from '@/services'
import config from '@utils/config'


let UNLIMIT = 1000000000


/**
 * Manages the relay server.
 * 
 * You can start/stop the relay and change upload and download
 * bandwidth limits
 */
class RelayManager {
  constructor () {
    this.relayServer = {}
    this.isRelayServerRunning = false

    this.openAccess = false
    this.natEnabled = store.state.natEnabled
    this.relayPort = store.state.relayPort

    this.uploadLimit = store.state.uploadLimit || UNLIMIT
    this.downloadLimit = store.state.downloadLimit || UNLIMIT
    this.bandwidthLimited = this.uploadLimit !== UNLIMIT || this.downloadLimit !== UNLIMIT
    this.uploadLimiter = ThrottleGroup({rate: this.uploadLimit})
    this.downloadLimiter = ThrottleGroup({rate: this.downloadLimit})

    if (this.natEnabled) {
      debug('NAT mode is enabled')
    } else {
      debug(`NAT mode is not enabled, running relay on port: ${this.relayPort}`)
    }   
  }

  changeUploadLimit (limitKB) {
    this.uploadLimit = limitKB * 8000
    store.commit('changeUploadLimit', limitKB * 8000)
    this.uploadLimiter.resetRate({rate: this.uploadLimit})
  }

  changeDownloadLimit (limitKB) {
    this.downloadLimit = limitKB * 8000
    store.commit('changeDownloadLimit', limitKB * 8000)
    this.downloadLimiter.resetRate({rate: this.downloadLimit})
  }

  changeNatStatus (natEnabled) {
    this.natEnabled = natEnabled
    store.commit('changeNatStatus', natEnabled)
    // NEED SOMETHING TODO
  }

  changeAccess (access) {
    if (access === this.openAccess) {
      return
    }

    this.openAccess = access
    store.commit('changeOpenAccess', this.openAccess)

    if (this.openAccess) {
      let publicaddress = this._getReachableAddress()
      API.relayUp(publicaddress.ip, publicaddress.port)
      this._restartRelayServer()
    } else {
      API.relayDown()
      this._stopRelayServer()
    }
  }

  async startRelay() {
    this.changeAccess(true)
  }

  async stopRelay() {
    this.changeAccess(false)
  }

  handleReconnect () {
    if (this.openAccess) {
      debug(this.openAccess)
      let publicaddress = this._getReachableAddress()
      API.relayUp(publicaddress.ip, publicaddress.port)
      this._restartRelayServer()
    }
  }

  _stopRelayServer () {
    if (this.isRelayServerRunning) {
      this.relayServer.close(() => {
        this.isRelayServerRunning = false
        this.relayServer = {}
      })
    }
  }

  async _restartRelayServer () {
    let localAddress = this._getLocalAddress()

    if (this.isRelayServerRunning) {
      this._stopRelayServer() 
    } 

    try {
      let server = await runOBFSserver(
        localAddress.ip, 
        localAddress.port,
        this.uploadLimiter,
        this.downloadLimiter
      )
      this.isRelayServerRunning = true
      this.relayServer = server
    } catch(err) {
      warn(err)
    }
  }

  _getReachableAddress () {
    let publicAddress = networkMonitor.getPublicAddress()

    if (this.natEnabled) {
      return {ip: publicAddress.ip, port: publicAddress.port}
    }
    return {ip: publicAddress.ip, port: this.relayPort}
  }

  _getLocalAddress () {
    let privateAddress = networkMonitor.getPrivateAddress()

    if (this.natEnabled) {
      return {ip: privateAddress.ip, port: privateAddress.port}
    }
    return {ip: '0.0.0.0', port: this.relayPort}
  }
}

export const relayManager = new RelayManager()
export default relayManager
