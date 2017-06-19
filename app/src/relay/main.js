process.env.APP_INTERFACE = 'commandline'

import { runTLSserver } from './net/TLSReceiver'
import { runOBFSserver } from './net/OBFSReceiver'
import { pendMgr } from './net/PendingConnections'
var stun = require('vs-stun')
import ServerConnection from '~/api/wsAPI'
import ConnectivityConnection from '~/api/connectivityAPI'
import httpAPI from '~/api/httpAPI'
import KVStore from '~/utils/kvstore'
import * as errors from '~/utils/errors'
import StatusReporter from './net/StatusReporter'
var stunserver = {
  host: 'stun.l.google.com',
  port: 19302
}

KVStore.get('relay', null)
  .then(relay => {
    if (relay) {
      return relay
    } else {
      console.log('Registering Relay')
      return httpAPI.registerRelay()
        .then(relay => {
          KVStore.set('relay', {id: relay.id, password: relay.password})
          return {id: relay.id, password: relay.password}
        })
    }
  })
  .then(relay => {
    console.log('Authenticating Relay')
    return httpAPI.authenticate(relay.id, relay.password)
  })
  .then(() => {
    console.log('Connecting to Connectivity server')
    return ConnectivityConnection.connect(httpAPI.getSessionID())
  })
  .then(port => {
    StatusReporter.startRoutine()
    console.log('Starting Relay')
    StatusReporter.port = port
    return runOBFSserver('0.0.0.0', port)
  })
  .then(() => {
    console.log('Connecting to WebSocket server')
    return ServerConnection.connect(httpAPI.getSessionID())
  })
  .then(() => {
    console.log('Server connection established')
    return ConnectivityConnection.relayUp(StatusReporter.port)
  })
  .catch(err => {
    if (err instanceof errors.NetworkError) {
      console.error('Could not connect to the server')
    } else if (err instanceof errors.AuthenticationError) {
      console.error('Authentication failed with server')
    } else if (err instanceof errors.RequestError) {
      console.error('Error occured in request to server ' + err.message)
    } else if (err instanceof errors.ServerError) {
      console.error('There is a problem with the server, please try again later')
    } else {
      console.log('Unknown error occured: ' + err.toString())
    }
  })

