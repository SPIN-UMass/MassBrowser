// Should be before importing anything
process.env.APP_INTERFACE = 'commandline'

import bootClient from './boot'
import Status from '~/utils/status'
import Raven from '~/utils/raven'


Raven
  .smartConfig({'role': 'client'})
  .install()

// Status.on('status-changed', function (status) {
//   console.log(status.text)
// })

bootClient()
process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})
