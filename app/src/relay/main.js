////OVERRIDE TLS
var tls = require('tls'),
  tlsconnect = tls.connect
tls.connect = function (...args) {
  delete args[0].servername
  return tlsconnect(...args)
}
////DANGERIOUS
import API from '~/relay/api'

import Raven from '~/utils/raven'
import Promise from 'bluebird'

import bootClient from '~/relay/boot'
import Status from '~/utils/status'

import { InvalidInvitationCodeError } from '~/utils/errors'
import { error } from '~/utils/log'
import config from '~/utils/config'
import { initializeLogging } from '~/utils/log'
import StatusReporter from '~/relay/net/StatusReporter'

import HealthManager from '~/relay/net/HealthManager'

global.Promise = Promise

config.applicationInterface = 'commandline'
initializeLogging()

Raven
  .smartConfig({'role': 'relay'})
  .install()

bootClient(false)
  .then(() => {
    HealthManager.changeAccess(true)
    console.log('MILAD')

  })

process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})
