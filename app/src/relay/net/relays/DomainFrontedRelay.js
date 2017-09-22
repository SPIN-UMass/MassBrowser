import http from 'http'
const net = require('net')
const url = require('url')
import { EventEmitter } from 'events'
import { ConnectionReceiver }  from '@/net/ConnectionReceiver'

export class DomainFrontedRelay {
  constructor(authenticator, port) {
    this.authenticator = authenticator
    this.port = port
    this.cdnManager = new CDNManger()
    this._server = null
  }

  start() {
    let proxy = this._server = http.createServer((req, res) => {
      this.cdnManager.handleIncommingConnection(req, res)
    })
    return new Promise((resolve,reject)=>{
      proxy.listen(this.port, '0.0.0.0', () => {
        resolve()
      })
    })
  }

  stop() {
    if (this._server) {
      this._server.close()
      this._server = null
      this.cdnManager = new CDNManger()
    }
  }

  restart() {
    this.stop()
    this.start()
  }
}

class CDNManger {
  constructor () {
    this.connectionmap = {}
  }

  handleIncommingConnection (req, res) {
    if (true) {
      this.connectionmap[req.socket] = new CDNSocketMeek(req.socket, req.headers.isPooling || false, req.headers.rtt || 40, req.headers.timeout || 500)
    }
    this.connectionmap[req.socket].newRequest(req, res)
  }
}


class CDNSocketMeek extends EventEmitter {
  constructor (socket, poolingMode, rtt, timeout) {
    super()

    this.socket = socket
    this.connection = new ConnectionReceiver(this, this, this, this.authenticator)
    this.responses = Buffer(0)
    this.needresponse = false
    this.response = undefined
    this.laststate = true
    this.poolingMode = poolingMode
    this.rtt = rtt
    this.timeout = timeout
  }

  end () {
    console.log('I am ending connection')
    this.response.end()
  }

  newRequest (req, res) {
    console.log('New Request')
    this.response = res

    req.on('data', (data) => {
      this.emit('data', data)
    })
    req.on('end', () => {
      this.needresponse = true
      this.laststate = true
      if (this.poolingMode) {
        this.respond()
      } else {
        setTimeout(this.respond, this.timeout)
      }
    })
  }

  write (data) {
    this.response.write(data)
  }

  respond () {
    if (this.needresponse) {
      if (this.responses.length() > 0) {
        this.response.write(this.responses)
        this.laststate = true
      }
    }
  }
}

export default DomainFrontedRelay