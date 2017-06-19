/**
 * Created by milad on 6/11/17.
 */
var schedule = require('node-schedule')
import   ConnectivityConnection from '~/api/connectivityAPI'

class _StatusReporter {

  constructor () {
    this.port = -1
  }
  startRoutine () {
    this._startKeepAlive()
  }

  _startKeepAlive () {
    schedule.scheduleJob('1 */1 * * * *', () => {
      ConnectivityConnection.keepAlive()
    })
  }

}
var StatusReporter = new _StatusReporter()
export default StatusReporter
