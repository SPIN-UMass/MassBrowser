import { runTLSserver } from './net/TLSReceiver'
import { runOBFSserver } from './net/OBFSReceiver'
import { pendMgr } from './net/PendingConnections'
var stun = require('vs-stun')
import ServerConnection from '~/api/wsAPI'
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
    console.log('Connecting to server')
    return ServerConnection.connect(httpAPI.getSessionID())
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      console.log('Detecting Network Type')
      stun.connect(stunserver, (error, socket) => {
        if (error) {
          reject(error)
        }
        console.log(socket.stun)
        resolve(socket.stun)
      }, {count: -1})
    })
  })
  .then((stun) => {
    console.log('Server connection established')
    return ServerConnection.relayUp(stun.public.host, '8087', 'PublicIP')
  })
  .then(data => {
    StatusReporter.startRoute()
    console.log('Starting Relay')
    runOBFSserver('0.0.0.0', 8087)
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

