////OVERRIDE TLS

// This part of the code is the core of domain-fronting technique:
// whenever we initiate a tls connection, we simply remove the
// servername field, which otherwise will be available in cleartext
// form for anyone on the path, so that censor will not be able to
// tell to which domain are trying to connect.

// Also note that there is no need to export/import this modified
// tls.connect function as the trick here is we gurantee this file
// console.js will be run first before any function call to
// tls.connect. Therefore, the modified version of the tls.connect
// will be available on the heap. Later, whenever we call tls.connect,
// Javascript will look for the heap first, which in turn, this
// modified version of tls.connect will be used.

// There are two benefits of using such a trick:

// First, the rest of the code in the project which calls a
// tls.connect does not even need to be aware of the existence of this
// tls modification to take the advantage of domain fronting.

// Second, comparing to other implementations, the approach does not
// require developers to take care of any changes happen in any other
// functions in the tls library.
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
  console.log("Main called")
  const args = parseArgs()

  await store.ready

  if (!(await registrationService.isRegistered())) {
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

console.log("Call main")
main()
