/**
 * Created by milad on 5/2/17.
 */

import Promise from 'bluebird'
import ConnectionManager from '~/client/net/ConnectionManager'
import RelayConnection from '~/client/net/RelayConnection'
import httpAPI from '~/api/httpAPI'
import { EventEmitter } from 'events'
import { logger, warn, debug, info } from '~/utils/log'
import { SessionRejectedError, NoRelayAvailableError } from '~/utils/errors'
var schedule = require('node-schedule')
import { Session } from '~/client/net/Session'
import { Domain, Category } from '~/client/models'

/**
 * Implements RelayAssigner
 */
class _SessionService extends EventEmitter {
  constructor () {
    super()

    this.sessions = []
    this.processedSessions = {}
    this.pendingSessions = {}
  }

  start () {
    ConnectionManager.setRelayAssigner(this)
    console.log('Starting Session Services')
    this._startSessionPoll()

    return this.createSession()
      .then(() => {debug('First session created')})
      .catch(NoRelayAvailableError, err => {
        warn('No relay available for first session')
      })
  }

  getSessions () {
    return this.sessions
  }

  assignRelay (host, port) {
    return new Promise((resolve, reject) => {
      if (this.sessions.length) {
        return resolve(this.sessions[0])
      }
      // No suitable session found
      return this.createSession([])
    })
      .then(session => session.connection)

    // return Domain.findDomain(host)
    //   .then(domain => domain.getWebsite())
    //   .then(website => website.getCategory())
    //   .then(category => {
    //     debug(`Assigning session for ${domain}`)

    //     /* TODO optimization */
    //     /* TODO is always returning the first one found */
    //     for (var i = 0; i < this.sessions.length; i++) {
    //       if (this.sessions[i].allowedCategories.has(category.id)) {
    //         return this.sessions[i]
    //       }
    //     }

    //     // No suitable session found
    //     return this.createSession(category)
    //   })
    //   .then(session => session.connection)

    // return new Promise((resolve, reject) => {
    //   var session = this.sessions[Math.floor(Math.random() * this.sessions.length)]
    //   resolve(session.connection)
    // })
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
    var categoryIDs = []
    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        categories = [categories]
      }
      categoryIDs = categories.map(c => (c instanceof Category ? c.id : c))
    }

    debug('Creating new session')

    return new Promise((resolve, reject) => {
      httpAPI.requestSession(categoryIDs)
        .then(session => {
          if (!session) {
            warn('No relay was found for new session')
            return reject(new NoRelayAvailableError('No relay is available for the requested session'))
          }

          debug(`Session [${session.id}] created, waiting for relay to accept`)

          this.pendingSessions[session.id] = {
            accept: _session => {
              debug(`Session [${session.id}] accepted by relay`)

              this.sessions.push(_session)
              this.emit('sessions-changed', this.sessions)

              debug(`Connecting session [${session.id}]`)
              _session.connect()
                .then(() => {
                  debug(`Session [${session.id}] connected`)
                  resolve(_session)
                })
                .catch(err => {
                  debug(`Session [${session.id}] connection to relay failed`)
                  reject(err)

                  // // Report session failure to server
                  httpAPI.updateSessionStatus(session.id, 'failed')
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
          httpAPI.updateSessionStatus(session.id, 'expired')

          return false
        }

        return true
      })

      debug(`Retrieved ${sessions.length} sessions (valid: ${validSessions.length}  stale: ${staleCount}  duplicate: ${duplicateCount})`)

      validSessions.forEach((session) => {
        var desc = {
          'readkey': Buffer.from(session.read_key, 'base64'),
          'readiv': Buffer.from(session.read_iv, 'base64'),
          'writekey': Buffer.from(session.write_key, 'base64'),
          'writeiv': Buffer.from(session.write_iv, 'base64'),
          'token': Buffer.from(session.token, 'base64'),
        }

        if (!(session.id in this.sessions)) {
          this.processedSessions[session.id] = desc
          var _session = new Session(session.id, session.relay.ip, session.relay.port, desc, session.relay['allowed_categories'],session.isCDN)

          if (session.id in this.pendingSessions) {
            let resolve = this.pendingSessions[session.id].accept
            delete this.pendingSessions[session.id]
            resolve(_session)
          } else {
            staleCount += 1
          }
        }
      })
    }
  }

  _startSessionPoll () {
    // httpAPI.getSessions()
    //       .then(ses => this._handleRetrievedSessions(ses))
    schedule.scheduleJob('*/2 * * * * *', () => {
      if (Object.keys(this.pendingSessions).length > 0) {
        httpAPI.getSessions()
          .then(ses => this._handleRetrievedSessions(ses))
      }
    })
  }
}

var SessionService = new _SessionService()
export default SessionService
