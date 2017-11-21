////OVERRIDE TLS
var tls = require('tls'),
  tlsconnect = tls.connect
tls.connect = function (...args) {
  delete args[0].servername
  return tlsconnect(...args)
}
////DANGERIOUS
import API from '@/api'

import Raven from '@utils/raven'
import Promise from 'bluebird'
import { InvalidInvitationCodeError } from '@utils/errors'
import { error } from '@utils/log'
import config from '@utils/config'
import { remote } from '@utils/remote'

import { syncService, relayManager, networkMonitor, registrationService } from '@/services'
import { statusManager, autoUpdater } from '@common/services'
import bootRelay from '@/boot'

global.Promise = Promise

remote.registerService('sync', syncService)
remote.registerService('status', statusManager)
remote.registerService('relay', relayManager)
remote.registerService('network-monitor', networkMonitor)
remote.registerService('boot', { boot: bootRelay })
remote.registerService('autoupdate', autoUpdater)
remote.registerService('registration', registrationService)

Raven
  .smartConfig({'role': 'relay'})
  .install()


process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})
