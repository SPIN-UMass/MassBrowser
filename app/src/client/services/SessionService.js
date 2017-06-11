/**
 * Created by milad on 5/2/17.
 */
import ConnectionManager from '~/client/net/ConnectionManager'
import RelayConnection from '~/client/net/RelayConnection'
import httpAPI from '~/api/httpAPI'
import { EventEmitter } from 'events'
var schedule = require('node-schedule')

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

    this.createSession()
  }

  getSessions () {
    return this.sessions
  }

  assignRelay (host, port) {
    return Domain.findDomain(host)
      .then(domain => domain.getWebsite())
      .then(website => website.getCategory())
      .then(category => {
        /* TODO optimization */
        /* TODO is always returning the first one found */
        for (var i = 0; i < this.sessions.length; i++) {
          if (this.sessions[i].allowedCategories.has(category.id)) {
            return this.sessions[i]
          }
        }

        // No suitable session found
        return this.createSession(category)
      })
      .then(session => session.connection)

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
    console.log('I AM HERE CREATING SESSIONS', categoryIDs)

    return new Promise((resolve, reject) => {
      httpAPI.requestSession(categoryIDs)
        .then(session => {
          console.log('accepting')

          this.pendingSessions[session.id] = {resolve: resolve, reject: reject}
          resolve()
        })
        .catch(err => {
          console.log('rejecting ')
          reject(err)
        })
    })
  }

  _handleRetrievedSessions (ses) {
    if (ses !== undefined) {
      ses.forEach((session) => {
        var desc = {
          'readkey': Buffer.from(session.read_key, 'base64'),
          'readiv': Buffer.from(session.read_iv, 'base64'),
          'writekey': Buffer.from(session.write_key, 'base64'),
          'writeiv': Buffer.from(session.write_iv, 'base64'),
          'token': Buffer.from(session.token, 'base64'),
        }

        if (!(session.id in this.sessions)) {
          this.processedSessions[session.id] = desc
          console.log('relay ip is', session.relay.ip, session.relay.port)

          var _session = new Session(session.id, session.relay.ip, session.relay.port, desc, session.relay['allowed_categories'])
          this.sessions.push(_session)
          _session.connect()

          if (session.id in this.pendingSessions) {
            this.pendingSessions[session.id].resolve(_session)
            delete this.pendingSessions[session.id]
          }

          this.emit('sessions-changed', this.sessions)
        }
      })
    }
  }

  _startSessionPoll () {
    schedule.scheduleJob('*/1 * * * * *', () => {
      httpAPI.getSessions()
        .then(ses => this._handleRetrievedSessions(ses))
    })
  }
}

var SessionService = new _SessionService()
export default SessionService

export class Session extends EventEmitter {
  constructor (id, ip, port, desc, allowedCategories) {
    super()

    this.id = id
    this.ip = ip
    this.port = port
    this.desc = desc
    this.allowedCategories = new Set(allowedCategories)
    this.connection = null

    this.connected = false
    this.connecting = false

    this.bytesSent = 0
    this.bytesReceived = 0
  }

  connect () {
    var relay = new RelayConnection(this.ip, this.port, this.desc)

    relay.on('data', data => {
      ConnectionManager.listener(data)
      this.bytesReceived += data.length
      this.emit('receive', data.length)
    })

    relay.on('send', data => {
      this.bytesSent += data.length
      this.emit('send', data.length)
    })

    relay.on('close', () => {
      ConnectionManager.connection_close()
    })

    this.connected = true
    return relay.connect()
      .then(() => {
        this.connection = relay
        this.connected = true
        this.connecting = false
      })
      .then(() => relay)
  }
}