import bootClient from './boot'
import Status from '~/utils/status'
import Raven fro '~/utils/raven'

Raven
  .smartConfig({'interface': 'commandline', 'role': 'client'})
  .install()

// Status.on('status-changed', function (status) {
//   console.log(status.text)
// })

bootClient()
process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})
