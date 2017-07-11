/**
 * Created by milad on 6/11/17.
 */
var schedule = require('node-schedule')
import   ConnectivityConnection from '~/api/connectivityAPI'
import ServerConnection from '~/api/wsAPI'
import { EventEmitter } from 'events'

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
  }

  _startKeepAlive () {
    schedule.scheduleJob('*/30 * * * * *', () => {
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

    })
  }

}
var StatusReporter = new _StatusReporter()
export default StatusReporter
