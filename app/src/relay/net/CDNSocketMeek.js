/**
 * Created by milad on 7/3/17.
 */
import ConnectionReceiver from './ConnectionReceiver'
import { EventEmitter } from 'events'

export default class CDNScoketMeek extends EventEmitter {

  constructor (socket, poolingMode, rtt, timeout) {
    super()
    this.socket = socket
    this.connection = new ConnectionReceiver(this, this, this)
    this.responses = Buffer()
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
    console.log('New Request', req)
    req.on('data', (data) => {
      this.emit('data', data)
    })
    req.on('end', () => {
      this.needresponse = true
      this.response = res
      this.laststate = true
      if (this.poolingMode) {
        this.respond()
      } else {
        setTimeout(this.respond, this.timeout)
      }
    })
  }

  write (data) {
    this.responses = Buffer.concat([this.responses, data])
    this.respond()
  }

  respond () {
    if (this.needresponse) {
      if (this.responses.length() > 0) {
        this.response.write(this.responses)
        this.laststate = true
      }
      // else {
      //   this.laststate = false
      // }
      // if (this.laststate === false) {
      //   this.response.end()
      //   this.needresponse = false
      // } else {
      //   setTimeout(this.respond, this.rtt)
      // }
    }
  }

}
