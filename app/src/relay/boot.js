import { runTLSserver } from './net/TLSReceiver'
import { runOBFSserver } from './net/OBFSReceiver'
import { runHTTPListener } from './net/HttpListener'

import { pendMgr } from './net/PendingConnections'

var stun = require('vs-stun')
import ConnectivityConnection from '~/api/connectivityAPI'
import API from '~/relay/api'
import KVStore from '~/utils/kvstore'
import * as errors from '~/utils/errors'
import StatusReporter from './net/StatusReporter'
import config from '~/utils/config'
import { initializeLogging } from '~/utils/log'

import { WebSocketTransport } from '~/utils/transport'
import { eventHandler } from '~/relay/events'


var stunserver = {
  host: 'stun.l.google.com',
  port: 19302
}

var isCalledbefore = false

export default function bootRelay () {
  if (isCalledbefore) {
    return new Promise((resolve, reject) => resolve())
  }

  isCalledbefore = true

  return KVStore.get('relay', null)
    .then(relay => {
      if (relay) {
        return relay
      } else {
        console.log('Registering Relay')
        return API.registerRelay()
          .then(relay => {
            KVStore.set('relay', {id: relay.id, password: relay.password})
            return {id: relay.id, password: relay.password}
          })
      }
    })
    .then(relay => {
      console.log(`Authenticating Relay ${relay.id}`)
      return API.authenticate(relay.id, relay.password)
    })
    .then(auth => {
      console.log('Connecting to WebSocket server')
      let transport = new WebSocketTransport(`${config.websocketURL}/api/?session_key=${auth.session_key}`)
      transport.setEventHandler(eventHandler)
      return transport.connect()
      .then(() => {
        API.setTransport(transport)
      })
    })
    .then(() => {
      console.log('Connecting to Connectivity server')
      return ConnectivityConnection.connect()
        .then(data => {
          StatusReporter.startRoutine()
          StatusReporter.localip = data[0]
          StatusReporter.localport = data[1]
          StatusReporter.remoteport = data[3]
          StatusReporter.remoteip = data[2]
          if (config.relay.natEnabled) {
            return {
              localIP: StatusReporter.localip,
              localPort: StatusReporter.localport,
              remoteIP: StatusReporter.remoteip,
              remotePort: StatusReporter.remoteport
            }
          } else {
            return {
              localIP: '0.0.0.0',
              localPort: config.relay.port,
              remoteIP: StatusReporter.remoteip,
              remotePort: config.relay.port
            }
          }
        })
    })
    .then(address => {
      console.log('Starting Relay')
      return runOBFSserver(address.localIP, address.localPort)
        .then(() => address)
    })
    .then((address) => {
      if (config.relay.domainfrontable) {
        console.log('Starting HTTP Server')
        return runHTTPListener(config.relay.domainfrontPort).then(() => address).then(() => {
          console.log('Reporting DomainFront to server')
          return ServerConnection.relayDomainFrontUp(config.relay.domain_name, config.relay.domainfrontPort)
        })
      }
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
}

