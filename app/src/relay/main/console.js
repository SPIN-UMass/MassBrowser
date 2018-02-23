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
import { info, error } from '@utils/log'
import config from '@utils/config'
import { remote } from '@utils/remote'

import { registrationService } from '@/services'
import { statusManager, autoUpdater } from '@common/services'
import bootRelay from '@/boot'
import { store } from '@utils/store'

global.Promise = Promise

// Raven
//   .smartConfig({'role': 'relay'})
//   .install()

async function main() {
  await store.ready
  
  if (!(await registrationService.isRegistered())) {
    info('Registering relay...')
    await registrationService.registerRelay()
  }
  
  info('Booting relay...')
  try {
    await bootRelay()
    info('Boot complete')
  } catch (e) {
    error(e)
    error('Boot failed, exiting')
  }
}

process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})

main()
