/**
 * Created by milad on 6/11/17.
 */
var schedule = require('node-schedule')
import ServerConnection from '~/api/wsAPI'

class _StatusReporter {

  startRoute () {
    this._startKeepAlive()
  }

  _startKeepAlive () {
    schedule.scheduleJob('1 */1 * * * *', () => {
      ServerConnection.keepAlive()
    })
  }

}
var StatusReporter = new _StatusReporter()
export default StatusReporter