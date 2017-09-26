import API from '@/api'
import config from '@utils/config'
import { debug, error } from '@utils/log'
import { Raven } from '@utils/raven'
import { statusManager } from '@common/services/statusManager'
import { syncService, relayManager, networkMonitor } from '@/services'
import { DomainFrontedRelay } from '@/net'
import { WebSocketTransport } from '@utils/transport'
import { eventHandler } from '@/events'
import { store } from '@utils/store'
import {
  AuthenticationError, NetworkError, RequestError,
  ServerError, ApplicationBootError
} from '@utils/errors'

export default async function bootRelay() {
  let status

  try {
    let relay = store.state.relay

    if (!relay) {
      throw new ApplicationBootError('Relay not registered')
    }

    status = statusManager.info(`Authenticating Relay`)
    let auth = await API.authenticate(relay.id, relay.password)
    status.clear()

    status = statusManager.info('Connecting to WebSocket server')
    let transport = new WebSocketTransport(
      `${config.websocketURL}/api/?session_key=${auth.session_key}`,
      '/api'
    )
    transport.setEventHandler(eventHandler)
    await transport.connect()
    API.setTransport(transport)
    status.clear()

    status = statusManager.info('Connecting to Connectivity server')
    await networkMonitor.start()
    status.clear()

    // Only sync database in boot if it is the first time booting
    // otherwise sync will after the client has started to avoid
    // having delay on each run
    let isFirstSync = await syncService.isFirstSync()
    if (isFirstSync) {
      debug('It is first boot, syncing database')
      let status = statusManager.info('Syncing database')
      await syncService.syncAll()
      status.clear()
    }

    status = statusManager.info('Starting Relay')
    relayManager.startRelay()
    status.clear()

    if (config.domainfrontable) {
      status = statusManager.info('Starting Domain Fronting Server')
      let domainFrontedRelay = new DomainFrontedRelay(relayManager.authenticator, config.domainfrontPort)
      await domainFrontedRelay.startRelay()
      await API.relayDomainFrontUp(config.domain_name, config.domainfrontPort)
      status.clear()
    }

    store.commit('completeBoot')
  } catch(err) {
    if (err instanceof AuthenticationError) {
      err.logAndReport()
      throw new ApplicationBootError('Server authentication failed, please contact support for help', false)
    } else if (err instanceof NetworkError) {
      err.log()
      throw new ApplicationBootError('Could not connect to the server, make sure you have a working Internet connection', true)
    } else if (err instanceof RequestError) {
      err.logAndReport()
      throw new ApplicationBootError('Error occured while booting application', true)
    } else if (err instanceof ServerError) {
      err.log()
      throw new ApplicationBootError('There is a problem with the server, please try again later', true)
    } else if (!(err instanceof ApplicationBootError)){
      // console.warn(handledErrors.reduce((o, a) => o || err instanceof a, false))
      if (err.smart) {
        err.logAndReport()
      } else {
        error(err)
        Raven.captureException(err)
      }
      throw new ApplicationBootError('Failed to start Application')
    }
  }
}

