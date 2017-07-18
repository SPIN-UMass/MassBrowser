/**
 * Created by milad on 7/12/17.
 */
import KVStore from '~/utils/kvstore'
var ThrottleGroup = require('./throttle').ThrottleGroup
import { runOBFSserver } from './OBFSReceiver'
import StatusReporter from './StatusReporter'
import { error, debug } from '~/utils/log'
import API from '~/relay/api'
let UNLIMIT=1000000000
class _HealthManager {
  constructor () {
    this.isRunningFromGUI = false
    this.natEnabled = false
    this.OBFSServer = {}
    this.HTTPServer = {}
    this.isOBFSServerRunning = false
    this.isHTTPServerRunning = false
    this.uploadLimit = UNLIMIT
    this.downloadLimit = UNLIMIT
    this.bandwidthLimited = false

    this.OBFSPortNumber = 8040
    this.HTTPPortNumber = 8083

    this.uploadLimiter = ThrottleGroup({rate: this.uploadLimit})
    this.downloadLimiter = ThrottleGroup({rate: this.downloadLimit})
    this.openAccess = false

    //
    KVStore.get('natEnabled', false).then((naten) => {
      this.natEnabled = naten
      debug('NAT STATUS', this.natEnabled)
      if (!naten) {
        KVStore.get('OBFSport', 8040).then((portnum) => {
          this.OBFSPortNumber = portnum
        })
      }
    }).then(() => {
      KVStore.get('uploadLimit', UNLIMIT).then((uplimit) => {
        this.uploadLimit = uplimit
        if (UNLIMIT !== uplimit) {
          this.bandwidthLimited = true
        }
        this.uploadLimiter.resetRate({rate: this.uploadLimit})
      })
    }).then(() => {
      KVStore.get('downloadLimit', UNLIMIT).then((downlimit) => {
        this.downloadLimit = downlimit
        if (UNLIMIT !== downlimit) {
          this.bandwidthLimited = true
        }
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
    if (access !== this.openAccess) {
      this.openAccess = access
      if (this.openAccess) {
        let publicaddress = this.getReachableOBFSAddress()
        API.relayUp(publicaddress.ip, publicaddress.port)
        this.restartOBFSServer()
      } else {
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

  getLocalOBFSAddress () {
    let privateAddress = StatusReporter.getPrivateAddress()

    if (this.natEnabled) {
      return {ip: privateAddress.ip, port: privateAddress.port}
    }
    return {ip: '0.0.0.0', port: this.OBFSPortNumber}
  }

  stopOBFSServer () {
    if (this.isOBFSServerRunning) {
      this.OBFSServer.close(() => {
        this.isOBFSServerRunning = false
        this.OBFSServer = {}
      })

    }
  }

  restartOBFSServer () {
    if (!this.isOBFSServerRunning) {
      runOBFSserver(this.getLocalOBFSAddress().ip, this.getLocalOBFSAddress().port, this.uploadLimiter, this.downloadLimiter).then((server) => {
        this.isOBFSServerRunning = true
        this.OBFSServer = server
      }).catch((err) => {
        this.errorHandler(err)
      })
    } else if (this.OBFSServer.address().port !== this.getLocalOBFSAddress().port) {
      this.stopOBFSServer()
      runOBFSserver(this.getLocalOBFSAddress().ip, this.getLocalOBFSAddress().port, this.uploadLimiter, this.downloadLimiter).then((server) => {
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
