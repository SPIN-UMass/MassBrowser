/**
 * Created by Christian Didong on 3/10/19.
 */

//import { TCPRelay, ConnectionAuthenticator, ThrottleGroup } from '@/net'
import { warn, error, debug } from '@utils/log'
import API from '@/api'
import { store } from '@utils/store'
import { statusManager } from '@common/services'
import { ConnectionType, UNLIMITED_BANDWIDTH } from '@common/constants'
//import { connectToClient } from '@common/net/relays/TCPRelay'
//import { CommonRelayManager } from '@common/services/commonRelayManager'
import { connectToClient } from '@common/net/relays/TCPRelay'
import { CommonRelayManager } from '@common/services/commonRelayManager'

export class ClientRelayManager extends CommonRelayManager {
    constructor() {
        console.log("Failing super class?")
        super()
    }

    // add own constructor of child class if necessary...

    // overwritten due to API? or should backend figure this out?
    // /relay/ path is stupid for c2c, I guess
    async changeAccess (access) {
        console.log("In changeAccess()")
        if (access === this.openAccess) {
          return
        }
    
        this.openAccess = access
        //console.log("Commit open access")
        store.commit('changeOpenAccess', this.openAccess)
    
        if (this.openAccess) {
          // networkManager has to be initialized before this is executed!!
          // slightly weird architecture
          //console.log("Calling _getReachableAddress()")
          let publicaddress = this._getReachableAddress()
          debug("Send clientRelayUp(), " + publicaddress.ip + ", " + publicaddress.port)
          API.clientRelayUp(publicaddress.ip, publicaddress.port)
          // this will create the TCPRelay from the super class
          await this._restartRelayServer()
          statusManager.info(`Relay server started on ip ${publicaddress.ip} on port ${publicaddress.port}`, { timeout: true })
        } else {
          // is there any other clean-up necessary? nothing else is called in relay?
          API.clientRelayDown()
          await this._stopRelayServer()
        }
    }
    
    // TODO: is this necessary for client relay? who should call it?
    // called over networkMonitor.js as some others to keep relay updated etc.
    // maybe a joint relay thing should go into common, I mean, why shouldn't the c2c proxying make use 
    // of the existing features... TODO: check if backend can cope with clients doing this stuff...
    handleReconnect () {
        if (this.openAccess) {
          debug(this.openAccess)
          let publicaddress = this._getReachableAddress()
          API.clientRelayUp(publicaddress.ip, publicaddress.port)
          this._restartRelayServer()
        }
    }

    connect(clientIP, clientPort, sessionId) {
        debug('Trying to connect to client with IP [${clientIP}], Port [${clientPort}] for session [${sessionId}]')
        // in TCPRelay file...
        connectToClient(clientIP, clientPort, sessionId)
    }

    //onNewSessionEvent (data)
    addPendingConnection(token, desc) {
        debug(`New session [${desc.sessionId}] received for client [${desc.client.id}]`)
    
        if (desc.connectionType === ConnectionType.TCP_CLIENT) {
            debug("Adding connection to pending connections.")
            this.authenticator.addPendingConnection((desc.token), desc)
        }

        // TODO maybe change
        API.updateC2CSessionStatus(desc.sessionId, 'relay_accepted')
        debug("Waiting for client to connect ...")
    }


}

export const clientRelayManager = new ClientRelayManager()
export default clientRelayManager