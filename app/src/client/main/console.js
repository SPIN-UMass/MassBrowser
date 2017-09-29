////OVERRIDE TLS
var tls = require('tls'),
 tlsconnect =tls.connect
tls.connect = function (...args) {
  delete args[0].servername
  return tlsconnect(...args)
}
////DANGERIOUS


import Raven from '@utils/raven'
import Promise from 'bluebird'

import bootClient from '@/boot'
import { statusManager } from '@common/status'

import { InvalidInvitationCodeError } from '@utils/errors'
import { error } from '@utils/log'
import { initializeLogging } from '@utils/log'
import config from '@utils/config'

global.Promise = Promise

initializeLogging()

Raven
  .smartConfig({'role': 'client'})
  .install()

// Status.on('status-changed', function (status) {
//   console.log(status.text)
// })

const invitationToken = 'mmn'

bootClient(() => new Promise((resolve, reject) => resolve(invitationToken)))
.catch(InvalidInvitationCodeError, err => {
  error("Invalid invitation code")
  process.exit(1)
})

process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})
