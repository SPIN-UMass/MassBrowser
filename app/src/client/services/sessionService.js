/**
 * Created by milad on 5/2/17.
 */

import { connectionManager, RelayConnection, Session } from '@/net'
import API from '@/api'
import { EventEmitter } from 'events'
import { logger, warn, debug, info } from '@utils/log'
import { SessionRejectedError, NoRelayAvailableError } from '@utils/errors'
import { store } from '@utils/store'


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
class SessionService extends EventEmitter {
  constructor () {
    super()

    this.sessions = []
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
    
  }

  async start () {
    connectionManager.setRelayAssigner(this)
    this._startSessionPoll()
  }

  async assignRelay (host, port) {
    let domain = await Domain.findDomain(host)
    let category = (await (await domain.getWebsite()).getCategory())

    debug(`Assigning session for ${domain} of category ${category.name}`) 
    let session = await this.assignSessionForCategory(category)
    return session.connection
  }

  async assignSessionForCategory(category) {
    // Search through active sessions to find session which allows category
    for (var i = 0; i < this.sessions.length; i++) {
      if (this.sessions[i].allowedCategories.has(category.id)) {
        return this.sessions[i]
      }
    }
  
    // Check category waitlists to see if the category already has a pending session
    if (category && this.categoryWaitLists[category.id]) {
      return new Promise((resolve, reject) => {
        this.categoryWaitLists[category.id].push(session => {
          resolve(session)
        })
      })
    }

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
      let sessionInfo = await API.requestSession(catIDs)

      if (!sessionInfo) {
        return reject(new NoRelayAvailableError('No relay is available for the requested session'))
      }

      debug(`Session [${sessionInfo.id}] created, waiting for relay to accept`)

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

  async _handleAcceptedSession(session, sessionInfo, resolve, reject) {
    debug(`Session [${sessionInfo.id}] accepted by relay`)

    try {
      if (session.connectionType === TCP_CLIENT) {
        debug(`Connecting session [${sessionInfo.id}]`)
        await session.connect()
      } else if (session.connectionType === TCP_RELAY) {
        API.updateSessionStatus(sessionInfo.id, 'client_accepted')
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
      API.updateSessionStatus(sessionInfo.id, 'failed')
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
      let session = new Session(sessionInfo.id, sessionInfo.relay.ip, sessionInfo.relay.port, desc, sessionInfo.relay['allowed_categories'], sessionInfo.connection_type, sessionInfo.relay.domain_name)

      let resolve = this.pendingSessions[sessionInfo.id].accept
      delete this.pendingSessions[sessionInfo.id]

      try {
        await resolve(session)
        await this._flushCategoryWaitLists(sessionInfo.relay['allowed_categories'] || [], session)
      } catch(e) {
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
        API.updateSessionStatus(session.id, 'expired')
        staleCount++
        return false
      }
      return true
    })
    debug(`Retrieved ${sessionInfos.length} sessions (valid: ${validSessionInfos.length}  stale: ${staleCount}  duplicate: ${duplicateCount}) `)
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

  _startSessionPoll () {
    if (this.sessionPollInterval != null) {
      return;
    }
    this.sessionPollInterval = setInterval(() => {
      if (Object.keys(this.pendingSessions).length > 0) {
        API.getSessions()
          .then(ses => this._handleRetrievedSessions(ses))
      } else {
        clearInterval(this.sessionPollInterval)
        this.sessionPollInterval = null
      }
    }, 2 * 1000)
  }
}

function storeUpdateSession(session, state) {
  store.commit('updateSession', {
    id: session.id,
    ip: session.relay.ip,
    state: state
  })
}

function storeRemoveSession(session) {
  store.commit('removeSession', {id: session.id})
}



export const sessionService = new SessionService()
export default sessionService
