/**
 * Created by Christian Didong on 3/10/19.
 */

import { warn, error, debug } from '@utils/log'
import API from '@/api'
import { store } from '@utils/store'
import { statusManager } from '@common/services'
import { ConnectionType, UNLIMITED_BANDWIDTH } from '@common/constants'
import { connectToClient } from '@common/net/relays/TCPRelay'
import { CommonRelayManager } from '@common/services/commonRelayManager'

export class ClientRelayManager extends CommonRelayManager {
    constructor() {
        console.log("Creating CommonRelayManager and ClientRelayManager...")
        super()
    }

    // overwritten to give relay_client information and change API calls 
    async changeAccess (access, is_relay_client) {
        debug("Changing Access for c2c proxying...")

        if (is_relay_client) {
            this.is_relay_client = true
        }

        if (access === this.openAccess) {
          return
        }
    
        this.openAccess = access
        store.commit('changeOpenAccess', this.openAccess)
    
        if (this.openAccess) {
          // networkManager has to be initialized before this is executed!!
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
          debug("this.openAccess called")
          let publicaddress = this._getReachableAddress()
          API.clientRelayUp(publicaddress.ip, publicaddress.port)
          this._restartRelayServer()
        }
    }

    connect(clientIP, clientPort, token) {
        debug('Trying to connect to client with IP [${clientIP}], Port [${clientPort}] for session [${sessionId}]')
        // in TCPRelay file...
        connectToClient(clientIP, clientPort, token)
    }

    //onNewSessionEvent (data)
    addPendingConnection(token, desc) {
        debug(`New session [${desc.sessionId}] received for client [${desc.client.id}]`)
    
        if (desc.connectionType === ConnectionType.TCP_CLIENT) {
            debug("Adding connection to pending connections.")
            this.authenticator.addPendingConnection((desc.token), desc)
        }

        API.updateC2CSessionStatus(desc.sessionId, 'relay_accepted')
        debug("Waiting for client to connect ...")
    }


}

export const clientRelayManager = new ClientRelayManager()
export default clientRelayManager