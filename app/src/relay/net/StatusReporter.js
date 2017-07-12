/**
 * Created by milad on 6/11/17.
 */
var schedule = require('node-schedule')
import   ConnectivityConnection from '~/api/connectivityAPI'
import API from '~/relay/api'
import { EventEmitter } from 'events'
import config from '~/utils/config'

class _StatusReporter extends EventEmitter {

  constructor () {
    super()
    this.localport = -1
    this.remoteport = -1
    this.remoteip = ''
    this.localip = ''
    this.reachable = false
    this.WSconnected = false
    this.isOpen = false
  }

  startRoutine () {

    this._startKeepAlive()
  }

  _startKeepAlive () {
    setTimeout(() => {
      this.sendKeepAlive()
    }, 500)
    schedule.scheduleJob('*/30 * * * * *', () => {
      this.sendKeepAlive()
    })
  }

  sendKeepAlive () {
    console.log('sessnign keepalive')
    API.keepAlive().then((res) => {
      this.WSconnected = true
      this.reachable = res.reachable
      this.emit('status-updated')
    }).catch((err) => {
      this.reachable = false
      this.WSconnected = false
      this.emit('status-updated')
    })
    ConnectivityConnection.keepAlive()
  }

  relayUP () {
    this.isOpen = true
    if (config.relay.natEnabled && this.WSconnected) {

      console.log('REPORTING RELAY UP')
      API.relayUp(this.remoteip, this.remoteport)
    }
  }

  relayDown () {
    this.isOpen = false
    if (this.WSconnected) {

      console.log('REPORTING RELAY DOWN')
      API.relayDown()
    }
  }

}
var StatusReporter = new _StatusReporter()
export default StatusReporter
