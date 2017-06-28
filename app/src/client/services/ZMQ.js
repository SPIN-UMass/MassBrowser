/**
 * Created by milad on 6/28/17.
 */
let REQUEST_ZMQ_SERVER = 'tcp://127.0.0.1:5557'
let RESULTS_ZMQ_SERVER = 'tcp://127.0.0.1:5558'
import {zmq} from 'zeromq'

class _ZMQListener {
  constructor () {
    this.requests = zmq.socket('pull')
    this.results = zmq.socket('push')
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
    console.log(data)
  }

}
var ZMQListener = new _ZMQListener()
export default ZMQListener
