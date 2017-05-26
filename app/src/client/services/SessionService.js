/**
 * Created by milad on 5/2/17.
 */
import ConnectionManager from '~/client/net/ConnectionManager';
import RelayConnection from '~/client/net/RelayConnection';
import httpAPI from '~/api/httpAPI'
import { EventEmitter } from 'events'
var schedule = require('node-schedule')


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

  start() {
    ConnectionManager.setRelayAssigner(this)
    this._startSessionPoll()

    this.createSession()
  }

  getSessions() {
    return this.sessions
  }

  assignRelay(ip, port) {
    return new Promise((resolve, reject) => {
      var session = this.sessions[Math.floor(Math.random() * this.sessions.length)]
      resolve(session.connection)
    })
  }

  createSession() {
    return new Promise((resolve, reject) => {
      httpAPI.requestSession()
      .then(session => {
        this.pendingSessions[session.id] = {resolve: resolve, reject: reject}
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  _handleRetrievedSessions(ses) {
    ses.forEach( (session) => {
      var desc = {
        'readkey': Buffer.from(session.read_key, 'base64'),
        'readiv': Buffer.from(session.read_iv, 'base64'),
        'writekey': Buffer.from(session.write_key, 'base64'),
        'writeiv': Buffer.from(session.write_iv, 'base64'),
        'token': Buffer.from(session.token, 'base64'),
      }

      if (!(session.id in this.sessions)) {
        this.processedSessions[session.id] = desc
        console.log('relay ip is',session.relay.ip, session.relay.port)
    
        var _session = new Session(session.id, session.relay.ip,  session.relay.port, desc)
        this.sessions.push(_session)
        _session.connect()

        if (session.id in this.pendingSessions) {
          pendingSessions[session.id].resolve(_session)
          delete pendingSessions[session.id]
        }

        this.emit('sessions-changed', this.sessions)
      }
    })
  }

  _startSessionPoll() {
    schedule.scheduleJob('*/1 * * * * *', () => {
      httpAPI.getSessions()
      .then(ses => this._handleRetrievedSessions(ses))
    })
  }
}

var SessionService = new _SessionService();
export default SessionService


export class Session extends EventEmitter {
  constructor(id, ip, port, desc) {
    super()

    this.id = id
    this.ip = ip
    this.port = port
    this.desc = desc
    this.connection = null
    
    this.connected = false
    this.connecting = false
    
    this.bytesSent = 0
    this.bytesReceived = 0
  }

  connect() {
    var relay = new RelayConnection(this.ip, this.port, this.desc)

    relay.on('data', data => {
      ConnectionManager.listener(data)
      this.bytesReceived += data.length
    })

    relay.on('send', data => {
      this.bytesSent += data.length
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