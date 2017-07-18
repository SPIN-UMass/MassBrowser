/**
 * Created by milad on 6/11/17.
 */
var schedule = require('node-schedule')
import   ConnectivityConnection from '~/api/connectivityAPI'
import API from '~/relay/api'
import { EventEmitter } from 'events'
import config from '~/utils/config'
import HealthManager from '~/relay/net/HealthManager'

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
    API.keepAlive(HealthManager.openAccess).then((res) => {
      this.WSconnected = true
      console.log(res.data)
      this.reachable = res.data.reachable
      this.emit('status-updated')
    }).catch((err) => {
      this.reachable = false
      this.WSconnected = false
      this.emit('status-updated')
    })
    ConnectivityConnection.keepAlive()
  }

  getPublicAddress () {
    return {ip: this.remoteip, port: this.remoteport}
  }
  getPrivateAddress () {
    return {ip: this.localip, port: this.localport}
  }

}
var StatusReporter = new _StatusReporter()
export default StatusReporter
