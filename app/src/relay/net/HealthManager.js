/**
 * Created by milad on 7/12/17.
 */
import KVStore from '~/utils/kvstore'
var ThrottleGroup = require('./throttle').ThrottleGroup
import { runOBFSserver } from './OBFSReceiver'
import StatusReporter from './StatusReporter'
import { error, debug } from '~/utils/log'
import API from '~/relay/api'

class _HealthManager {
  constructor () {
    this.isRunningFromGUI = false
    this.natEnabled = false
    this.OBFSServer = {}
    this.HTTPServer = {}
    this.isOBFSServerRunning = false
    this.isHTTPServerRunning = false
    this.uploadLimit = 1000000000
    this.downloadLimit = 1000000000
    this.OBFSPortNumber = -1
    this.HTTPPortNumber = 8083
    this.uploadLimiter = ThrottleGroup({rate: this.uploadLimit})
    this.downloadLimiter = ThrottleGroup({rate: this.downloadLimit})
    this.openAccess = false

    //
    KVStore.get('natEnabled', false).then((naten) => {
      this.natEnabled = naten
      if (!naten) {
        KVStore.get('OBFSport', 8040).then((portnum) => {
          this.OBFSPortNumber = portnum
        })
      }
    }).then(() => {
      KVStore.get('uploadLimit', 1000000000).then((uplimit) => {
        this.uploadLimit = uplimit
        this.uploadLimiter.resetRate({rate: this.uploadLimit})
      })
    }).then(() => {
      KVStore.get('downloadLimit', 1000000000).then((downlimit) => {
        this.downloadLimit = downlimit
        this.downloadLimiter.resetRate({rate: this.downloadLimit})
      })
    })
  }

  startMonitor (fromGUI) {
    this.isRunningFromGUI = fromGUI
  }

  changeUploadLimit (limitKB) {
    this.uploadLimit = limitKB * 8000
    KVStore.set('uploadLimit', limitKB * 8000)
    this.uploadLimiter.resetRate({rate: this.uploadLimit})
  }

  changeDownloadLimit (limitKB) {
    this.downloadLimit = limitKB * 8000
    KVStore.set('downloadLimit', limitKB * 8000)
    this.downloadLimiter.resetRate({rate: this.downloadLimit})
  }

  changeNatStatus (natEnabled) {
    this.natEnabled = natEnabled
    KVStore.set('natEnabled', natEnabled)
    // NEED SOMETHING TODO
  }

  changeAccess (access) {
    if (access != this.openAccess) {
      this.openAccess = access
      if (this.openAccess) {
        let publicaddress = this.getReachableOBFSAddress()
        API.relayUp(publicaddress.ip, publicaddress.port)
        this.restartOBFSServer()
      }
      else {
        API.relayDown()
        this.stopOBFSServer()
      }

    }
  }

  getReachableOBFSAddress () {
    let publicAddress = StatusReporter.getPublicAddress()

    if (this.natEnabled) {
      return {ip: publicAddress.ip, port: publicAddress.port}
    }
    return {ip: publicAddress.ip, port: this.OBFSPortNumber}

  }

  stopOBFSServer () {
    if (this.isOBFSServerRunning) {
      this.OBFSServer.end()
    }
  }

  restartOBFSServer () {
    this.stopOBFSServer()
    if (!this.isOBFSServerRunning || this.OBFSServer.address().port != this.getReachableOBFSAddress().port) {
      runOBFSserver('0.0.0.0', this.getReachableOBFSAddress().port, this.uploadLimiter, this.downloadLimiter).then((server) => {
        this.isOBFSServerRunning = true
        this.OBFSServer = server
      }).catch((err) => {
        this.errorHandler(err)
      })
    }

  }

  errorHandler (err) {
    debug(err)
  }

}
var HealthManager = new _HealthManager()
export default HealthManager
