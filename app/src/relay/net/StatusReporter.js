/**
 * Created by milad on 6/11/17.
 */
var schedule = require('node-schedule')
import ConnectivityConnection from '@/connectivityAPI'
import API from '@/api'
import { EventEmitter } from 'events'
import config from '@utils/config'
import HealthManager from '@/net/HealthManager'

class _StatusReporter extends EventEmitter {

  constructor () {
    super()
    this.localport = -1
    this.remoteport = -1
    this.remoteip = ''
    this.localip = ''
    this.reachable = false
    this.WSconnected = false
    this.routineStatus = false
  }

  startRoutine () {
    if (this.routineStatus) {
      return
    }
    this.routineStatus = true
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

  ConncetivityResHandler (data) {
    StatusReporter.startRoutine()
    // console.log('Connectivity', data)
    if (StatusReporter.localip !== data[0] || StatusReporter.localport !== data[1] || StatusReporter.remoteport !== data[3] || StatusReporter.remoteip !== data[2]) {
      StatusReporter.localip = data[0]
      StatusReporter.localport = data[1]
      StatusReporter.remoteport = data[3]
      StatusReporter.remoteip = data[2]
      HealthManager.handleReconnect()
    }
  }

  ConnectivityErrorHandler () {
    if (HealthManager.openAccess) {
      ConnectivityConnection.reconnect()

    }
  }

  connectConnectivity () {
    ConnectivityConnection.connect((data) => {
      this.ConncetivityResHandler(data)
    }, () => {
      this.ConnectivityErrorHandler()
    })
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
