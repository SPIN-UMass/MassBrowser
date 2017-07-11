/**
 * Created by milad on 6/11/17.
 */
var schedule = require('node-schedule')
import   ConnectivityConnection from '~/api/connectivityAPI'
import ServerConnection from '~/api/wsAPI'
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
  }

  startRoutine () {
    this._startKeepAlive()
    this.sendKeepAlive()
  }

  _startKeepAlive () {
    schedule.scheduleJob('*/30 * * * * *', () => {
      this.sendKeepAlive()
    })
  }

  sendKeepAlive () {
    ServerConnection.keepAlive().then((res) => {
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
    if (config.relay.natEnabled && this.WSconnected) {
      ServerConnection.relayUp(this.remoteip, this.remoteport)
    }
  }

  relayDown () {
    if (config.relay.WSconnected) {
      ServerConnection.relayDown()
    }
  }

}
var StatusReporter = new _StatusReporter()
export default StatusReporter
