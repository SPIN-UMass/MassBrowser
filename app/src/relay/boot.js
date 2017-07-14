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
import {
  AuthenticationError, NetworkError, RequestError,
  ServerError, ApplicationBootError
} from '~/utils/errors'

import { WebSocketTransport } from '~/utils/transport'
import { eventHandler } from '~/relay/events'

import HealthManager from '~/relay/net/HealthManager'

var stunserver = {
  host: 'stun.l.google.com',
  port: 19302
}

var isCalledbefore = false

export default function bootRelay (gui) {
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
      let transport = new WebSocketTransport(
        `${config.websocketURL}/api/?session_key=${auth.session_key}`,
        '/api'
      )
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
        })
    })
    .then(() => {
      console.log('Starting Relay')
      HealthManager.startMonitor(gui)
    })
    .then(() => {
      if (config.relay.domainfrontable) {
        console.log('Starting HTTP Server')
        return runHTTPListener(HealthManager.HTTPPortNumber).then(() => {
          console.log('Reporting DomainFront to server')
          return API.relayDomainFrontUp(config.relay.domain_name, config.relay.domainfrontPort)
        })
      }
    })
    .catch(AuthenticationError, err => {
      err.logAndReport()
      throw new ApplicationBootError('Server authentication failed, please contact support for help', false)
    })
    .catch(NetworkError, err => {
      err.log()
      throw new ApplicationBootError('Could not connect to the server, make sure you have a working Internet connection', true)
    })
    .catch(RequestError, err => {
      err.logAndReport()
      throw new ApplicationBootError('Error occured while booting application', true)
    })
    .catch(ServerError, err => {
      err.log()
      throw new ApplicationBootError('There is a problem with the server, please try again later', true)
    })
    .catch(err => !(err instanceof ApplicationBootError ), err => {
      // console.warn(handledErrors.reduce((o, a) => o || err instanceof a, false))
      if (err.smart) {
        err.logAndReport()
      } else {
        error(err)
        Raven.captureException(err)
      }

      throw new ApplicationBootError('Failed to start Application')
    })
}

