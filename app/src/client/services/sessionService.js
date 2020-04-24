import { connectionManager, Session } from '@/net'
import { EventEmitter } from 'events'
import { warn, debug } from '@utils/log'
import { SessionRejectedError, NoRelayAvailableError } from '@utils/errors'
import { store } from '@utils/store'
import { torService, telegramService } from '@common/services'
import { ConnectionTypes } from '@common/constants'
import udpConnectionService from '@common/services/UDPConnectionService'
import { Domain, Category } from '@/models'
import API from '@/api'
let TEST_URL = 'backend.yaler.co'
import {throttleCall} from '@utils'

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
    this.sessionHeartInterval = null
  }

  async start () {
    connectionManager.setRelayAssigner(this)
    // this._startSessionPoll()
    this._startSessionHeart()
  }

  /** figure out the corresponding category of the host(domain/IP)
   * net.isIP() will return 0 or 4 or 6 */

  async assignRelay (host, port) {
    // figure out the corresponding category of the host(domain/IP)
    const { category } = await this.findHostModels(host)

    if (!category) {
      debug(`Assigning session for ${host} of failed`)
      return
    }

    debug(`Assigning session for ${host} of category ${category.name}`)
    // assign a session based on the category of the requested host
    let session = await this.assignSessionForCategory(category)
    return session.connection
  }

  async findHostModels (host) {
    if (net.isIP(host)) {
      let torCategory = (await Category.find({name: 'Tor'}))[0]
      let telegramCategory = (await Category.find({name: 'Messaging'}))[0]
      if (torService.isTorIP(host)) {
        return { category: torCategory }
      } else if (telegramService.isTelegramIP(host)) {
        return { category: telegramCategory }
      } else {
        return {}
      }
    } else {
      const domain = await Domain.findDomain(host)
      if (!domain) {
        let cat = {'name': 'DIRECT'}
        return {host,host, cat}
      }
      const website = await domain.getWebsite()
      const category = await website.getCategory()
      return { domain, website, category }
    }
  }

  async assignSessionForCategory (category) {
    debug(`Searching sessions for ${category.name}`)
    for (let i = 0; i < this.sessions.length; i++) {
      if (this.sessions[i].allowedCategories.has(category.id)) {
        debug(`Sessions for ${category.name} Assigned`)
        return this.sessions[i]
      }
    }

    if (category && this.categoryWaitLists[category.id]) {
      debug(`Pending sessions for ${category.name}`)
      return new Promise((resolve, reject) => {
        this.categoryWaitLists[category.id].push(session => {
          resolve(session)
        })
      })
    }
    debug(`Sessions for ${category.name} requested to be created`)
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

  async createSession (categories) {
    return new Promise(async (resolve, reject) => {
      categories = Array.isArray(categories) ? categories : [categories]
      let catIDs = categories.map(c => c.id)

      catIDs.forEach(category => {
        if (!this.categoryWaitLists[category]) {
          this.categoryWaitLists[category] = []
        }
      })

      debug(`Requesting for new session`)
      let sessionInfo = await API.requestSession(catIDs)

      if (!sessionInfo) {
        catIDs.forEach(category => {
          if (this.categoryWaitLists[category]) {
            delete this.categoryWaitLists[category]
          }
        })
        return reject(new NoRelayAvailableError('No relay is available for the requested session'))
      }

      if (sessionInfo.connection_type === ConnectionTypes.UDP) {
        debug('creating connection object for udp pending session')
        console.log(sessionInfo.token)
        udpConnectionService.createEncryptedConnection(sessionInfo.relay.ip, sessionInfo.relay.udp_port, sessionInfo.token, true)
      }

      debug(`Session [${sessionInfo.id}] created, waiting for relay to accept`)
      this.pendingSessions[sessionInfo.id] = {
        accept: session => this._handleAcceptedSession(session, sessionInfo, resolve, reject),
        reject: s => {
          warn(`Session [${sessionInfo.id}] rejected by relay`)
          storeRemoveSession(sessionInfo)
          reject(new SessionRejectedError('session was rejected by relay'))
        },
        sessionInfo
      }

      storeUpdateSession(sessionInfo, 'pending')
      this.emitPendingSessionUpdate(sessionInfo)
      this._startSessionPoll()
    })
  }

  async _handleAcceptedSession (session, sessionInfo, resolve, reject) {
    debug(`Session [${sessionInfo.id}] accepted by relay`)
    try {
      if (session.connectionType === ConnectionTypes.TCP_CLIENT) {
        debug(`Connecting session [${sessionInfo.id}]`)
        await session.connect()
      } else if (session.connectionType === ConnectionTypes.TCP_RELAY) {
        API.updateSessionStatus(sessionInfo.id, 'client_accepted')
        await session.listen()
      } else if (session.connectionType === ConnectionTypes.UDP) {
        await session.connect()
      }

      this.sessions.push(session)
      storeUpdateSession(sessionInfo, 'active')
      this.emitSessionUpdate(session)

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

  _handleClosedSessions (session) {
    let index = this.sessions.indexOf(session)
    this.sessions.splice(index, 1)
  }

  async handleNewClientSessions (sessionInfo) {
    debug('GOT ACCEPTED SESSION')
    let desc = {
      'readkey': Buffer.from(sessionInfo.read_key, 'base64'),
      'readiv': Buffer.from(sessionInfo.read_iv, 'base64'),
      'writekey': Buffer.from(sessionInfo.write_key, 'base64'),
      'writeiv': Buffer.from(sessionInfo.write_iv, 'base64'),
      'token': Buffer.from(sessionInfo.token, 'base64')
    }
    if (sessionInfo.id in this.sessions || !(sessionInfo.id in this.pendingSessions)) {
      // TODO: give warning here
      debug('HERE is something wrong')
      return
    }

    for (let i = 0; i < this.sessions.length; i++) {
      if (this.sessions[i].ip === sessionInfo.relay.ip) {
        debug('I already have a session with this relay')
        // it means we already have a session with this relay
        return
      }
    }

    let session = new Session(sessionInfo.id, sessionInfo.relay.ip, sessionInfo.relay.port, sessionInfo.relay.udp_port,
      desc, sessionInfo.relay['allowed_categories'], sessionInfo.connection_type, sessionInfo.relay.domain_name)

    let resolve = this.pendingSessions[sessionInfo.id].accept
    delete this.pendingSessions[sessionInfo.id]

    session.on('send', () => this.emitSessionUpdate(session))
    session.on('receive', () => this.emitSessionUpdate(session))
    session.on('state-changed', () => this.emitSessionUpdate(session))

    try {
      await resolve(session)
      await this._flushCategoryWaitLists(sessionInfo.relay['allowed_categories'] || [], session)
    } catch (e) {
      /* Refer to Bug #1 */
      (sessionInfo.relay['allowed_categories'] || []).forEach(category => {
        if (this.categoryWaitLists[category.id]) {
          delete this.categoryWaitLists[category.id]
        }
      })
    }
  }

  async _handleRetrievedSessions (sessionInfos) {
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
        'token': Buffer.from(sessionInfo.token, 'base64')
      }
      if (sessionInfo.id in this.sessions || !(sessionInfo.id in this.pendingSessions)) {
        // TODO: give warning here
        continue
      }

      for (let i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].ip === sessionInfo.relay.ip) {
          // it means we already have a session with this relay
          return
        }
      }

      this.processedSessions[sessionInfo.id] = desc
      let session = new Session(sessionInfo.id, sessionInfo.relay.ip, sessionInfo.relay.port, sessionInfo.relay.udp_port,
        desc, sessionInfo.relay['allowed_categories'], sessionInfo.connection_type, sessionInfo.relay.domain_name)

      let resolve = this.pendingSessions[sessionInfo.id].accept
      delete this.pendingSessions[sessionInfo.id]

      session.on('send', () => this.emitSessionUpdate(session))
      session.on('receive', () => this.emitSessionUpdate(session))
      session.on('state-changed', () => this.emitSessionUpdate(session))

      try {
        await resolve(session)
        await this._flushCategoryWaitLists(sessionInfo.relay['allowed_categories'] || [], session)
      } catch (e) {
        /* Refer to Bug #1 */
        (sessionInfo.relay['allowed_categories'] || []).forEach(category => {
          if (this.categoryWaitLists[category.id]) {
            delete this.categoryWaitLists[category.id]
          }
        })
      }
    }
  }

  _filterValidSessions (sessionInfos) {
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
      return
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

  _startSessionHeart () {
    if (this.sessionHeartInterval) {
      return
    }
    this.sessionHeartInterval = setInterval(() => this.sessionHeartBeat(), 30 * 1000)
  }

  async testSession (session) {
    debug(`testing session ${session.id}`)
    connectionManager.testConnect(TEST_URL, 80, session.connection, () => {
      debug(`Session ${session.id} is still valid`)
    }, () => {
      debug(`Session ${session.id} is dead`)
    })
  }

  sessionHeartBeat () {
    for (let i = 0; i < this.sessions.length; i++) {
      this.testSession(this.sessions[i])
    }
  }

  async getSessionDetails () {
    const pending = Object.values(this.pendingSessions).map(s => pendingSessionToSessionDetails(s.sessionInfo))
    return pending.concat(this.sessions.map(sessionToSessionDetails))
  }

  emitSessionUpdate (session) {
    throttleCall(`session-update-${session.id}`, 500, () => {
      this.emit('session-update', session.id, sessionToSessionDetails(session))
    })
  }

  emitPendingSessionUpdate (sessionInfo) {
    throttleCall(`session-update-${sessionInfo.id}`, 500, () => {
      this.emit('session-update', sessionInfo.id, pendingSessionToSessionDetails(sessionInfo))
    })
  }
}

function sessionToSessionDetails (session) {
  return {
    id: session.id,
    state: session.state,
    ip: session.ip,
    port: session.port,
    domainName: session.domainName,
    sent: session.bytesSent,
    received: session.bytesReceived
  }
}

function pendingSessionToSessionDetails (sessionInfo) {
  const session = sessionInfo.relay || {}
  return {
    id: sessionInfo.id,
    state: session.state,
    ip: session.ip,
    port: session.port,
    sent: 0,
    received: 0
  }
}

function storeUpdateSession (session, state) {
  store.commit('updateSession', {
    id: session.id,
    ip: session.relay.ip,
    state: state
  })
}

function storeRemoveSession (session) {
  store.commit('removeSession', {id: session.id})
}

export const sessionService = new SessionService()
export default sessionService
