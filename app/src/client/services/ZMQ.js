import { Session } from '@/net/Session'
import { connectionManager } from '@/net/connectionManager'
import { ConnectionTypes } from '@common/constants'
import udpConnectionService from '@common/services/UDPConnectionService'
let REQUEST_ZMQ_SERVER = 'tcp://127.0.0.1:5560'
let RESULTS_ZMQ_SERVER = 'tcp://127.0.0.1:5558'
const SESSION_TIMEOUT = 10000
const REACH_CLIENT_MAIN_UDP_PORT = 21312
const REACH_CLIENT_ALT_UDP_PORT = 21313
const zeromq = require('zeromq')

class _ZMQListener {
  constructor () {
    console.log('starting ZMQ')
    this.requests = zeromq.socket('pull')
    this.results = zeromq.socket('push')
    this.validSessions = new Set()
  }

  async connect () {
    this.requests.connect(REQUEST_ZMQ_SERVER)
    this.requests.on('message', (msg) => {
      this.onRequest(msg)
    })
    this.results.connect(RESULTS_ZMQ_SERVER)
    console.log('Connected TO ZMQ servers')
    await udpConnectionService.start(false, REACH_CLIENT_MAIN_UDP_PORT, REACH_CLIENT_ALT_UDP_PORT)
  }

  async testConnection (session) {
    if (session.connection_type === ConnectionTypes.UDP) {
      if (session.test_type === 'client') {
        udpConnectionService.createEncryptedConnection(session.client.ip, session.client.udp_port, session.token, true)
      } else {
        udpConnectionService.createEncryptedConnection(session.relay.ip, session.relay.udp_port, session.token, true)
      }
    }
    return new Promise((resolve, reject) => {
      try {
        console.log(session)
        var desc = {
          'readkey': Buffer.from(session.read_key, 'base64'),
          'readiv': Buffer.from(session.read_iv, 'base64'),
          'writekey': Buffer.from(session.write_key, 'base64'),
          'writeiv': Buffer.from(session.write_iv, 'base64'),
          'token': Buffer.from(session.token, 'base64')
        }
        this.validSessions.add(session)
        var _session
        if (session.test_type === 'client') {
          _session = new Session(session.id, session.client.ip, session.client.port, session.client.udp_port, desc, session.client['allowed_categories'], session.connection_type)
        } else if (session.test_type === 'relay') {
          _session = new Session(session.id, session.relay.ip, session.relay.port, session.relay.udp_port, desc, session.relay['allowed_categories'], session.connection_type)
        }
        _session.connect().then(() => {
          console.log('Session Connected', session.id)
          connectionManager.testConnect(session.destination.dst, session.destination.port, _session.connection, () => {
            if (this.validSessions.has(session)) {
              this.validSessions.delete(session)
              _session.connection.end()
              this.onConnect(session)
            }
          }, () => {
            if (this.validSessions.has(session)) {
              console.log('session failed happened')
              this.validSessions.delete(session)
              _session.connection.end()
              this.onDisconnect(session)
            }
          })
        }).catch((err) => {
          console.log('session error happened', err)
          if (this.validSessions.has(session)) {
            this.validSessions.delete(session)
            this.onDisconnect(session)
          }
        })
      } catch (e) {
        console.log('error happened', e)
        this.validSessions.delete(session)
        this.onDisconnect(session)
      }
      resolve()
    })
  }

  onRequest (data) {
    let session = JSON.parse(data.toString())
    this.testConnection(session).then(() => {
      console.log('session', session.id, 'received')
    }, () => {
      console.log('session', session.id, session.connection_type, ' received but rejected')
      this.onDisconnect(session)
    })
  }

  onDisconnect (session) {
    let res = {}
    res['token'] = session['token']
    res['id'] = session['id']
    res['is_reachable'] = false
    res['client_id'] = session['client']['id']
    res['relay_id'] = session['relay_id']
    res['connection_type'] = session['connection_type']
    res['test_type'] = session['test_type']
    console.log(session.id, 'is not reachable')
    this.results.send(JSON.stringify(res))
  }

  onConnect (session) {
    let res = {}
    res['token'] = session['token']
    res['id'] = session['id']
    res['is_reachable'] = true
    res['client_id'] = session['client']['id']
    res['relay_id'] = session['relay_id']
    res['connection_type'] = session['connection_type']
    res['test_type'] = session['test_type']
    console.log(session.id, 'is reachable')
    this.results.send(JSON.stringify(res))
  }
}
var ZMQListener = new _ZMQListener()
export default ZMQListener
