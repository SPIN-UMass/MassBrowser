import bootClient from './boot'
import Status from '~/utils/status'
require('events').EventEmitter.prototype._maxListeners = 10000;
Status.on('status-changed', function (status) {
  console.log(status.text)
})

bootClient()
process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})
