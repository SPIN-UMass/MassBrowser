/**
 * Created by milad on 6/11/17.
 */
var schedule = require('node-schedule')
import   ConnectivityConnection from '~/api/connectivityAPI'
import ServerConnection from '~/api/wsAPI'
class _StatusReporter {

  constructor () {
    this.localport = -1
    this.remoteport = -1
    this.remoteip = ''
    this.localip = ''
  }

  startRoutine () {
    this._startKeepAlive()
  }

  _startKeepAlive () {
    schedule.scheduleJob('*/1 * * * * *', () => {
      ServerConnection.keepAlive()
      ConnectivityConnection.keepAlive()

    })
  }

}
var StatusReporter = new _StatusReporter()
export default StatusReporter
