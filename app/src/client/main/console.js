////OVERRIDE TLS
var tls = require('tls'),
 tlsconnect =tls.connect
tls.connect = function (...args) {
  delete args[0].servername
  return tlsconnect(...args)
}
////DANGERIOUS

import { ArgumentParser } from 'argparse'

import Raven from '@utils/raven'

import { InvalidInvitationCodeError } from '@utils/errors'
import { debug, info, warn, error } from '@utils/log'
import config from '@utils/config'

import { statusManager } from '@common/services/statusManager'
import { syncService, registrationService } from '@/services'
import { store } from '@utils/store' // required for boot, don't remove
import bootClient from '@/boot'
import models from '@/models' // required for bootstrapping remote models


function parseArgs() {
  const parser = new ArgumentParser({
    addHelp: true,
    description: 'MassBrowser'
  });
  parser.addArgument(
    [ '-i', '--invitation-code' ],
    {
      help: 'Invitation code for registering client',
      dest: 'invitationCode',
      required: false
    }
  );
  return parser.parseArgs();
}

async function main() {
  const args = parseArgs()

  await store.ready

  if (!registrationService.isRegistered()) {
    info("Registering client...")

    if (!args.invitationCode) {
      error('No invitation code provided')
      process.exit(1)
    }

    try {
      debug(`Registerting client with invitation code: ${args.invitationCode}`)
      const client = await registrationService.registerClient(args.invitationCode)    
      debug(`Client registered with ID ${client.id}`)
    } catch(e) {
      if (e instanceof InvalidInvitationCodeError) {
        error('Invalid invitation code provided')
        process.exit(1)
      } else {
        throw e
      }     
    }
  }

  info('Booting MassBrowser client...')
  bootClient()
}


process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', function (err) {
  console.log('err uncaught Exception  : ', err)
})

main()
