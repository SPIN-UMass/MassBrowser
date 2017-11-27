////OVERRIDE TLS
var tls = require('tls'),
 tlsconnect =tls.connect
tls.connect = function (...args) {
  delete args[0].servername
  return tlsconnect(...args)
}
////DANGERIOUS

import minimist from 'minimist'

import Raven from '@utils/raven'

import { InvalidInvitationCodeError } from '@utils/errors'
import { debug, info, warn, error } from '@utils/log'
import config from '@utils/config'

import { statusManager } from '@common/services/statusManager'
import { syncService, registrationService } from '@/services'
import { store } from '@utils/store' // required for boot, don't remove
import bootClient from '@/boot'
import models from '@/models' // required for bootstrapping remote models

const argv = minimist(process.argv.slice(2))
console.dir(argv)

async function start() {
  if (!registrationService.isRegistered()) {
    info("Client not registered")
    console.log("SHIT")
    if (!argv.invitationCode) {
      error('No invitation code provided')
      process.exit(1)
    }

    debug(`Registerting client with invitation code: ${argv.invitationCode}`)
    let client = await registrationService.registerClient(argv.invitationCode)    
    info(`Client registered with ID ${client.id}`)
  }

  // bootClient()
}



process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})

start()
