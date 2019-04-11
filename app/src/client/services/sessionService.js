/**
 * Created by milad on 5/2/17.
 */

import { connectionManager, RelayConnection, Session } from '@/net'
import { clientRelayManager } from '@/services'
//import { clientRelayManager } from '@/net'
//import { clientRelayManager } from '@/net/clientRelayManager'
import API from '@/api'
import { EventEmitter } from 'events'
import { logger, warn, debug, info } from '@utils/log'
import { SessionRejectedError, NoRelayAvailableError } from '@utils/errors'
import { store } from '@utils/store'
import { torService, telegramService } from '@common/services'

let TEST_URL="backend.yaler.co"
import { Domain, Category } from '@/models'

let TCP_CLIENT = 0
let TCP_RELAY = 1
let UDP = 2
let CDN = 3

/**
 * Note: Implements RelayAssigner
 *
 * TODO Bug #1: If a session is created for category C, then another session is requests
 * for the same category, the second session will go in the waitlist. Now, if the first session
 * isn't accepted for any reason then the second session will remain in the waitlist forever and
 * any session after that will just be added to the waitlist. To solve this for now, if a session
 * is rejected then we will remove the category from the waitlists.
 *
 */
const net = require('net')

class SessionService extends EventEmitter {
  constructor () {
    super()

    console.log("Creating SessionService object")
    this.sessions = []
    this.c2csessions = []
    this.processedSessions = {}

    /**
     * Sessions which have been requested and are waiting to be accepted by the relays
     * For every pending session, a object containing two function, accept and reject,
     * will be stored with the session ID
     */
    this.pendingSessions = {}

    /**
     * Categories which sessions have already been requested for but have no active
     * sessions yet.
     *
     * Each pending category will have a list in the object stored with the categories ID.
     * The list will contain callback functions which will be called when a session is
     * created for that category
     */
    this.categoryWaitLists = {}

    this.sessionPollInterval = null

    this.sessionHeartInterval = null

    // decides if client has c2c proxying activated
    this.c2c_allowed = false
    this.c2c_sessionPollInterval = null
    console.log("SessionService created")
  }

  async start () {
    console.log("Starting sessionService.js")
    connectionManager.setRelayAssigner(this)
    this._startSessionPoll()
    this._startSessionHeart()

    // for testing now:
    debug('Starting c2c_proxying')
    this.activate_c2c_proxying()
  }

  // called from connectionManager to get a relay
  async assignRelay (host, port) {
    // figure out the corresponding category of the host(domain/IP)
    if (net.isIP(host)) {  // net.isIP() will return 0 or 4 or 6
      let torCategory = (await Category.find({name: 'Tor'}))[0]

      let telegramCategory =  (await Category.find({name: 'Messaging'}))[0]

      if (torService.isTorIP(host)) {
        var category = torCategory
      }
      else if (telegramService.isTelegramIP(host)) {
        var category = telegramCategory
      }
      else {
        debug(`Assigning session for ${host} of failed`)
        return
      }
    }
    else {
      let domain = await Domain.findDomain(host)
      var category = (await (await domain.getWebsite()).getCategory())
    }

    debug(`Assigning session for ${host} of category ${category.name}`)
    // assign a session based on the category of the requested host
    let session = await this.assignSessionForCategory(category)
    return session.connection
  }
  
  // called from assignRelay()
  async assignSessionForCategory(category) {
    // Search through active sessions to find session which allows category
    debug(`Searching sessions for ${category.name}`)
    for (var i = 0; i < this.sessions.length; i++) {
      if (this.sessions[i].allowedCategories.has(category.id)) {
        debug(`Sessions for ${category.name} Assigned`)
        return this.sessions[i]
      }
    }

    // Check category waitlists to see if the category already has a pending session


    if (category && this.categoryWaitLists[category.id]) {
      debug(`Pending sessions for ${category.name}`)
      return new Promise((resolve, reject) => {
        this.categoryWaitLists[category.id].push(session => {
          resolve(session)
        })
      })
    }
    debug(`Sessions for ${category.name} requested to be created`)
    
    // if no existing session for the category is available, request a new one
    return this.createSession(category)
  }

  /**
   * Request a new session from the server.
   *
   * @param categories A category or array of categories which the session
   * should allow
   *
   * @return A promise which is resolved when the session has been accepted by
   * the corresponding Relay
   */
  // called from assignSessionForCategory if no matching relay exists
  async createSession(categories) {
    categories = Array.isArray(categories) ? categories : [categories]
    let catIDs = categories.map(c => c.id)

    catIDs.forEach(category => {
      if (!this.categoryWaitLists[category]) {
        this.categoryWaitLists[category] = []
      }
    })

    return new Promise(async (resolve, reject) => {
      debug(`Requesting for new session`)
      // here, the client could also decide if he allows c2c
      let sessionInfo = await API.requestSession(catIDs)

      if (!sessionInfo) {
        catIDs.forEach(category => {
          if (this.categoryWaitLists[category]) {
            delete this.categoryWaitLists[category]
          }
        })
        return reject(new NoRelayAvailableError('No relay is available for the requested session'))
      }

      debug(`Session [${sessionInfo.id}] created, waiting for relay to accept`)

      // C2C could be redirected here for the client if necessary
      this.pendingSessions[sessionInfo.id] = {
        accept: session => this._handleAcceptedSession(session, sessionInfo, resolve, reject),
        reject: s => {
          warn(`Session [${sessionInfo.id}] rejected by relay`)
          storeRemoveSession(sessionInfo)
          reject(new SessionRejectedError('session was rejected by relay'))
        }
      }

      storeUpdateSession(sessionInfo, 'pending')
      this._startSessionPoll()
    })
  }
  
  // called when session is accepted by relay through _handleRetrievedSessions() 
  async _handleAcceptedSession(session, sessionInfo, resolve, reject) {
    debug(`Session [${sessionInfo.id}] accepted by relay`)

    try {
      if (session.connectionType === TCP_CLIENT) {
        debug(`Connecting session [${sessionInfo.id}]`)
        await session.connect()
      } else if (session.connectionType === TCP_RELAY) {
        if (sessionInfo.relay_client) {
            API.updateC2CSessionStatus(sessionInfo.id, 'client_accepted')
        } else {
            API.updateSessionStatus(sessionInfo.id, 'client_accepted')
        }
        await session.listen()
      }

      this.sessions.push(session)
      storeUpdateSession(sessionInfo, 'active')

      debug(`Session [${sessionInfo.id}] connected`)
      resolve(session)
      return session

    } catch (err) {
      debug(`Session [${sessionInfo.id}] connection to relay failed`)
      reject(err)
      // Report session failure to server
      if (sessionInfo.relay_client) {
        API.updateC2CSessionStatus(sessionInfo.id, 'failed')
      } else {
        API.updateSessionStatus(sessionInfo.id, 'failed')
      }
      throw err
    }
  }

  /**
   * Is called when accepted sessions are received from the server
   *
   * Resolves pending sessions with the newly created sessions
   */

  _handleClosedSessions(session) {
    console.log(this.sessions)
    let index = this.sessions.indexOf(session)
    this.sessions.splice(index,1)
    console.log(this.sessions)
  }

  // any session received from backend is handled by this method
  // called by _startSessionPoll() for every received session
  async _handleRetrievedSessions(sessionInfos) {
    if (sessionInfos === undefined) {
      return
    }

    let validSessionInfos = this._filterValidSessions(sessionInfos)

    for (let sessionInfo of validSessionInfos) {
      var desc = {
        'readkey': Buffer.from(sessionInfo.read_key, 'base64'),
        'readiv': Buffer.from(sessionInfo.read_iv, 'base64'),
        'writekey': Buffer.from(sessionInfo.write_key, 'base64'),
        'writeiv': Buffer.from(sessionInfo.write_iv, 'base64'),
        'token': Buffer.from(sessionInfo.token, 'base64'),
      }

      // debug(`sessions ${session.connection_type}`)

      if (sessionInfo.id in this.sessions || !(sessionInfo.id in this.pendingSessions)) {
        // TODO: give warning here
        continue
      }

      this.processedSessions[sessionInfo.id] = desc
      let session_ip, session_port, session_allowed_categories, session_domain_name;
      if (sessionInfo.relay_client) {
        session_ip = sessionInfo.relay_client.ip
        // c2c_port used for incoming connections of clients
        session_port = sessionInfo.relay_client.c2c_port
        session_allowed_categories = sessionInfo.relay_client['allowed_categories']
        session_domain_name = null
      } else {
        session_ip = sessionInfo.relay.ip
        session_port = sessionInfo.relay.port
        session_allowed_categories = sessionInfo.relay['allowed_categories']
        session_domain_name = sessionInfo.relay.domain_name
      }
      let session = new Session(sessionInfo.id, session_ip, session_port, desc, 
        session_allowed_categories, sessionInfo.connection_type, session_domain_name)
      //let session = new Session(sessionInfo.id, sessionInfo.relay.ip, sessionInfo.relay.port, desc, 
      //  sessionInfo.relay['allowed_categories'], sessionInfo.connection_type, sessionInfo.relay.domain_name)

      // accept is a method of a pending session that is called below via handle_accepted_session
      let resolve = this.pendingSessions[sessionInfo.id].accept
      delete this.pendingSessions[sessionInfo.id]

      try {
        debug("Resolving retrieved session")
        await resolve(session)
        debug("Session resolved, flushing waitlists...")
        if (sessionInfo.relay_client) {
            await this._flushCategoryWaitLists(sessionInfo.relay_client['allowed_categories'] || [], session)
        } else {
            await this._flushCategoryWaitLists(sessionInfo.relay['allowed_categories'] || [], session)
        }
        //await this._flushCategoryWaitLists(sessionInfo.relay['allowed_categories'] || [], session)
      } catch(e) {
        debug("Catched exception that in turn crashes, is this bug #1?")
        /* Refer to Bug #1 */
        (sessionInfo.relay['allowed_categories'] || []).forEach(category => {
          if (this.categoryWaitLists[category.id]) {
            delete this.categoryWaitLists[category.id]
          }
        })
      }
    }
  }

  _filterValidSessions(sessionInfos) {
    var [staleCount, duplicateCount] = [0, 0]
    var validSessionInfos = sessionInfos.filter(session => {
      if (session.id in this.sessions) {
        duplicateCount++
        return false
      } else if (!(session.id in this.pendingSessions)) {
        // Report stale session to server
        if (sessionInfo.relay_client) {
          API.updateC2CSessionStatus(session.id, 'expired')
        } else {
          API.updateSessionStatus(session.id, 'expired')
        }
        staleCount++
        return false
      }
      return true
    })
    debug(`Client: Retrieved ${sessionInfos.length} sessions (valid: ${validSessionInfos.length}  stale: ${staleCount}  duplicate: ${duplicateCount}) `)
    return validSessionInfos
  }

  async _flushCategoryWaitLists (categories, session) {
    categories.forEach(category => {
      let waitList = this.categoryWaitLists[category.id]
      if (waitList !== undefined) {
        delete this.categoryWaitLists[category.id]
        waitList.forEach(callback => callback(session))
      }
    })
  }

  // called by createSession() and once among startup
  _startSessionPoll () {
    if (this.sessionPollInterval != null) {
      return
    }
    this.sessionPollInterval = setInterval(() => {
      if (Object.keys(this.pendingSessions).length > 0) {
        API.getSessions()
          .then(ses => this._handleRetrievedSessions(ses))
        if (this.c2c_allowed) {
            // these are retrieved as client
            API.getReqC2CSessions().then(ses => this._handleRetrievedSessions(ses))
        }
      } else {
        clearInterval(this.sessionPollInterval)
        this.sessionPollInterval = null
      }
    }, 2 * 1000)
  }

  _startSessionHeart () {
    if (this.sessionHeartInterval) {
      return
    }

    this.sessionHeartInterval = setInterval(() => this.sessionHeartBeat(), 30 * 1000)
  }

  async testSession(session) {
    debug(`testing session ${session.id}`)
    connectionManager.testConnect(TEST_URL,80,session.connection,()=>{
      debug(`Session ${session.id} is still valid`)
    },()=>{
      debug(`Session ${session.id} is dead`)
    })


  }
  sessionHeartBeat() {
    for (var i = 0; i < this.sessions.length; i++) {
      this.testSession(this.sessions[i])
    }
  }

  //---------------------------------------------

  _C2CstartSessionPoll () {
    debug("Starting _C2CstartSessionPoll().")
    if (!this.c2c_allowed) {
        debug('C2C Poll called, but c2c proxying is turned off.')
        return
    }
    
    // maybe check connectivity and reconnect here if necessary?
    // not sure as there are no checks on the client side atm.
    // does the client have to register c2c explicitly?
    this.c2c_sessionPollInterval = setInterval(() => {
        //debug("Sending C2CSessions()")
        API.getC2CSessions()
            .then(ses => this._handleCurrentC2CSessions(ses))
        }, 4 * 1000)
    
    if (false) {
        if (this.sessionPollInterval != null) {
        return
        }
        this.sessionPollInterval = setInterval(() => {
        if (Object.keys(this.pendingC2CSessions).length > 0) {
            API.getSessions()
            .then(ses => this._handleRetrievedC2CSessions(ses))
        } else {
            clearInterval(this.sessionPollInterval)
            this.sessionPollInterval = null
        }
        }, 2 * 1000)
    }
  }

  async _handleCurrentC2CSessions(sessionInfos) {
    // TODO 
    if (sessionInfos === undefined) {
        return
      }
      let validSessionInfos = this._filterValidC2CSessions(sessionInfos)

      // TODO: is this robust to manipulations? I guess it's all send over TLS anyway?
      for (let sessionInfo of validSessionInfos) {
        // readkey is readkey from client's perspective, 
        // so for the relay_client readkey is the write_key
        // I assume this was never documented whatsoever...read_key read_iv write_key write_iv
        var desc = {
          'readkey': Buffer.from(sessionInfo.write_key, 'base64'),
          'readiv': Buffer.from(sessionInfo.write_iv, 'base64'),
          'writekey': Buffer.from(sessionInfo.read_key, 'base64'),
          'writeiv': Buffer.from(sessionInfo.read_iv, 'base64'),
          'token': Buffer.from(sessionInfo.token, 'base64'),
          'client': sessionInfo.client,
          'connectionType': sessionInfo.connection_type,
          'sessionId': sessionInfo.id
          // client data is not checked by relay either, so probably doesn't matter anyway.
          // relay explicitly saves sessionInfo.connection_type, client information etc.
        }
  
        // debug(`sessions ${session.connection_type}`)
        
        // This should never happen due to _filterValidC2CSessions
        if (sessionInfo.id in this.c2csessions) {
          // TODO: give warning here
          debug("Already handled session, but somehow it is only realized in _handleCurrentC2CSessions()")
          continue
        }
        
        // C2C Session or can this stay?
        // this has to be handled differently similar to how a relay would do it?!
        // sessionInfo is delivered from backend! So adapt it
        this._handleNewC2CSession(desc)
      }
  }

  _filterValidC2CSessions(sessionInfos) {
    var alreadyProcessedCount = 0
    var validSessionInfos = sessionInfos.filter(session => {
      if (session.id in this.c2csessions) {
        // Client got its own session which should not happen
        // TODO: check if invalid is valid status
        API.updateC2CSessionStatus(session.id, 'invalid')
        alreadyProcessedCount += 1
        return false
      }
      return true
    })
    debug(`C2C: Retrieved ${sessionInfos.length} sessions (valid: ${validSessionInfos.length}  invalid: ${alreadyProcessedCount})`)
    return validSessionInfos
  }

  async _handleNewC2CSession(desc) {
    try {
      // does TCP_CLIENT already work for c2c?
      // I guess it has to be exactly reversed, so if one sends TCP_RELAY the other guy acts as a relay.
      //console.log(desc)
      debug('Executing _handleNewC2CSession()')
      //debug(desc)
      if (desc.connectionType === TCP_RELAY) {
        console.log("if1")
        debug(`Connecting session [${desc.client.id}]`)
        // connect to client
        //data.client.ip, data.client.port, data.id
        clientRelayManager.connect(desc.client.ip, desc.client.port, desc.sessionId)
      } else if (desc.connectionType === TCP_CLIENT) {
        console.log("if2")
        debug('Wating for client to connect [${desc.sessionId}]')
        // addPendingConnection updates status already...
        //API.updateC2CSessionStatus(desc.sessionId, 'client_accepted')
        // TCPRelay should already be running like in Relay?
        clientRelayManager.addPendingConnection((desc.token), desc)
      } else {
          debug("Unknown connection type.")
      }
    } catch (err) {
      console.log("if3")
      debug(`C2CSession [${desc.client.id}] connection to client failed`)
      // Report session failure to server
      API.updateC2CSessionStatus(desc.client.id, 'failed')
      throw err
    }
  }


  activate_c2c_proxying() {
    clientRelayManager.changeAccess(true)
    this.c2c_allowed = true
    this._C2CstartSessionPoll()
  }

  deactivate_c2c_procying() {
    clientRelayManager.changeAccess(false)
    this.c2c_allowed = false
    // Session poll stops automatically as soon as c2c_allowed is false.
  }

}



// ---------------------------------------



function storeUpdateSession(sessionInfo, state) {
  let ip = sessionInfo.relay_client ? sessionInfo.relay_client.ip : sessionInfo.relay.ip
  store.commit('updateSession', {
    id: sessionInfo.id,
    ip: ip,
    state: state
  })

  //store.commit('updateSession', {
  //  id: session.id,
  //  ip: session.relay.ip,
  //  state: state
  //})
}

function storeRemoveSession(session) {
  store.commit('removeSession', {id: session.id})
}



export const sessionService = new SessionService()
export default sessionService
