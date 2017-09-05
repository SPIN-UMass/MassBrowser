/**
 * Created by milad on 5/2/17.
 */

import ConnectionManager from '@/net/ConnectionManager'
import RelayConnection from '@/net/RelayConnection'
import API from '@/api'
import { EventEmitter } from 'events'
import { logger, warn, debug, info } from '@utils/log'
import { SessionRejectedError, NoRelayAvailableError } from '@utils/errors'
var schedule = require('node-schedule')
import { Session } from '@/net/Session'
import { Domain, Category } from '@/models'

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
class _SessionService extends EventEmitter {
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


  }

  start () {
    ConnectionManager.setRelayAssigner(this)
    console.log('Starting Session Services')
    this._startSessionPoll()
    return new Promise((resolve, reject) => {resolve()})

    /*return this.createSession()
     .then(() => {debug('First session created')})
     .catch(NoRelayAvailableError, err => {
     warn('No relay available for first session')
     })*/
  }

  getSessions () {
    return this.sessions
  }

  assignRelay (host, port) {
    return Domain.findDomain(host)
      .then(domain => {
        debug(`Assigning session for ${domain}`)
        return domain
      })
      .then(domain => domain.getWebsite())
      .then(website => website.getCategory())
      .then(category => {

        /**
         * Search through active sessions to find session which allows category
         * 
         * TODO optimization
         */
        for (var i = 0; i < this.sessions.length; i++) {
          // console.log('allowed',this.sessions[i].allowedCategories)
          if (this.sessions[i].allowedCategories.has(category.id)) {
            return this.sessions[i]
          }
        }

        /**
         * Check category waitlists to see if the category already has
         * a pending session
         */
        if (category && this.categoryWaitLists[category.id]) {
          return new Promise((resolve, reject) => {
            this.categoryWaitLists[category.id].push(session => {
              resolve(session)
            })
          })
        }

        /* No session found, create new session */
        return this.createSession(category)
      })
      .then(session => session.connection)
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
  createSession (categories) {
    var catIDs = []

    if (categories) {
      if (!Array.isArray(categories)) {
        categories = [categories]
      }

      for (let i = 0; i < categories.length; i++) {
        let cat = categories[i]
        catIDs.push(cat.id)
      }
    }
    // console.log('Creating new session', categories, 'ids', catIDs)

    catIDs.forEach(category => {
      if (!this.categoryWaitLists[category]) {
        this.categoryWaitLists[category] = []
      }
    })

    return new Promise((resolve, reject) => {
      API.requestSession(catIDs)
        .then(session => {
          if (!session) {
            warn('No relay was found for new session')
            return reject(new NoRelayAvailableError('No relay is available for the requested session'))
          }

          debug(`Session [${session.id}] created, waiting for relay to accept`)

          this.pendingSessions[session.id] = {
            accept: _session => {
              return new Promise((_resolve, _reject) => {
                debug(`Session [${session.id}] accepted by relay`)

                this.sessions.push(_session)
                this.emit('sessions-changed', this.sessions)

                debug(`Connecting session [${session.id}]`)
                _session.connect()
                  .then(() => {
                    debug(`Session [${session.id}] connected`)
                    resolve(_session)
                    _resolve(_session)
                  })
                  .catch(err => {
                    debug(`Session [${session.id}] connection to relay failed`)
                    reject(err)
                    _reject(err)
                    // // Report session failure to server
                    API.updateSessionStatus(session.id, 'failed')
                  })
              })
            },
            reject: s => {
              warn(`Session [${session.id}] rejected by relay`)
              reject(new SessionRejectedError('session was rejected by relay'))
            }
          }
        })
    })
  }

  _handleRetrievedSessions (sessions) {
    if (sessions !== undefined) {
      var [staleCount, duplicateCount] = [0, 0]
      var validSessions = sessions.filter(session => {
        if (session.id in this.sessions) {
          duplicateCount++
          return false
        } else if (!(session.id in this.pendingSessions)) {
          staleCount++

          // Report stale session to server
          API.updateSessionStatus(session.id, 'expired')

          return false
        }

        return true
      })

      debug(`Retrieved ${sessions.length} sessions (valid: ${validSessions.length}  stale: ${staleCount}  duplicate: ${duplicateCount}) `)

      validSessions.forEach((session) => {
        var desc = {
          'readkey': Buffer.from(session.read_key, 'base64'),
          'readiv': Buffer.from(session.read_iv, 'base64'),
          'writekey': Buffer.from(session.write_key, 'base64'),
          'writeiv': Buffer.from(session.write_iv, 'base64'),
          'token': Buffer.from(session.token, 'base64'),
        }
        debug(`sessions ${session.is_cdn}`)

        if (!(session.id in this.sessions)) {
          this.processedSessions[session.id] = desc
          var _session = new Session(session.id, session.relay.ip, session.relay.port, desc, session.relay['allowed_categories'], session.is_cdn, session.relay.domain_name)

          if (session.id in this.pendingSessions) {
            let resolve = this.pendingSessions[session.id].accept
            delete this.pendingSessions[session.id]
            resolve(_session)
            .then(_session => this._flushCategoryWaitLists(session.relay['allowed_categories'] || [], _session))
            .catch(() => {
              /* Refer to Bug #1 */
              (session.relay['allowed_categories'] || []).forEach(category => {
                if (this.categoryWaitLists[category.id]) {
                  delete this.categoryWaitLists[category.id]
                }
              })
            })
          } else {
            staleCount += 1
          }
        }
      })
    }
  }

  _flushCategoryWaitLists(categories, session) {
    categories.forEach(category => {
      let waitList = this.categoryWaitLists[category.id]
      if (waitList !== undefined) {
        delete this.categoryWaitLists[category.id]
        waitList.forEach(callback => callback(session))
      }
    })
  }

  _startSessionPoll () {
    // API.getSessions()
    //       .then(ses => this._handleRetrievedSessions(ses))
    schedule.scheduleJob('*/2 * * * * *', () => {
      if (Object.keys(this.pendingSessions).length > 0) {
        API.getSessions()
          .then(ses => this._handleRetrievedSessions(ses))
      }
    })
  }
}

var SessionService = new _SessionService()
export default SessionService
