/**
 * Created by milad on 6/28/17.
 */
import Session from './SessionService'
import ConnectionManager from '../net/ConnectionManager'

let REQUEST_ZMQ_SERVER = 'tcp://127.0.0.1:5560'
let RESULTS_ZMQ_SERVER = 'tcp://127.0.0.1:5558'
const zeromq = require('zeromq')
class _ZMQListener {
  constructor () {
    this.requests = zeromq.socket('pull')
    this.results = zeromq.socket('push')
  }

  connect () {
    this.requests.connect(REQUEST_ZMQ_SERVER)
    this.requests.on('message', (msg) => {
      this.onRequest(msg)
    })
    this.results.connect(RESULTS_ZMQ_SERVER)
    console.log('Connected TO ZMQ servers')
  }

  onRequest (data) {
    let session = JSON.parse(data.toString())
    console.log(session)
    var desc = {
      'readkey': Buffer.from(session.read_key, 'base64'),
      'readiv': Buffer.from(session.read_iv, 'base64'),
      'writekey': Buffer.from(session.write_key, 'base64'),
      'writeiv': Buffer.from(session.write_iv, 'base64'),
      'token': Buffer.from(session.token, 'base64')
    }

    var _session = new Session(session.id, session.relay.ip, session.relay.port, desc, session.relay['allowed_categories'])
    ConnectionManager.testConnect(session.destination.dst, session.destination.port, _session.connection, () => {
      this.onResponse(session)
    }, () => {
      this.onDisconnect(session)
    })

  }

  onDisconnect (session) {
    console.log(session, 'is not reachable')
  }

  onConnect (session) {
    console.log(session, 'is reachable')

  }

}
var ZMQListener = new _ZMQListener()
export default ZMQListener
