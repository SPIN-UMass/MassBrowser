import API from '@/api'
import config from '@utils/config'
import { sleep } from '@utils'
import { debug, error, warn } from '@utils/log'
import { Raven } from '@utils/raven'
import { statusManager, autoLauncher, torService, telegramService } from '@common/services'
import { syncService, relayManager, networkMonitor, registrationService } from '@/services'
import { DomainFrontedRelay } from '@/net'
import { HttpTransport, WebSocketTransport } from '@utils/transport'
import { eventHandler } from '@/events'
import { Category } from '@/models'
import { store } from '@utils/store'
import {
  AuthenticationError, NetworkError, RequestError,
  ServerError, ApplicationBootError
} from '@utils/errors'

export default async function bootRelay () {
  console.log("Boot Sequence")
  let status

  try {
    await store.ready

    let relay = await registrationService.getRegisteredUser()

    if (!relay) {
      throw new ApplicationBootError('Relay not registered')
    }

    status = statusManager.info(`Waiting for Internet conection`)
    await waitForInternet()
    status.clear()

    status = statusManager.info(`Authenticating Relay`)
    let auth = await API.authenticate(relay.id, relay.password)
    status.clear()

    debug(`Relay authenticated with id ${relay.id}`)

    status = statusManager.info('Connecting to WebSocket server')
    let transport = new WebSocketTransport(
      `${config.websocketURL}/api/?session_key=${auth.session_key}`,
      '/api'
    )
    transport.setEventHandler(eventHandler)
    await transport.connect()
    API.setTransport(transport)
    status.clear()

    /** Only sync database in boot if it is the first time booting
    * otherwise sync will after the client has started to avoid
    * having delay on each run */

    let isFirstSync = await syncService.isFirstSync()

    debug('It is first boot, syncing database')
    let status = statusManager.info('Syncing database')
    await syncService.syncAll()
    status.clear()

    status = statusManager.info('Syncing allowed categories')
    await syncService.syncAllowedCategories()
    const enabledCategories = await Category.find({enabled: true})
    if (!enabledCategories.length) {
      warn('You have 0 categories enabled, users will not be able to connect')
    } else {
      debug(`You have ${enabledCategories.length} categories enabled`)
    }
    status.clear()

    if (await torService.requiresDownload()) {
      status = statusManager.info('Downloading Tor list')
      await torService.downloadTorList()
      status.clear()
    }
    status = statusManager.info('Loading Tor list')
    await torService.loadTorList()
    status.clear()

    if (await telegramService.requiresDownload()) {
      status = statusManager.info('Downloading Telegram list')
      await telegramService.downloadTelegramList()
      status.clear()
    }
    status = statusManager.info('Loading Telegram list')
    await telegramService.loadTelegramList()
    status.clear()

    status = statusManager.info('Connecting to Connectivity server')
    await networkMonitor.start()
    status.clear()
    status = statusManager.info('Obtaining NAT information')
    await networkMonitor.waitForNetworkStatus()
    status.clear()

    status = statusManager.info('Starting Relay')
    await relayManager.startRelay()
    status.clear()

    if (config.domainfrontable) {
      status = statusManager.info('Starting Domain Fronting Server')
      let domainFrontedRelay = new DomainFrontedRelay(relayManager.authenticator, config.domainfrontPort)
      await domainFrontedRelay.startRelay()
      await API.relayDomainFrontUp(config.domain_name, config.domainfrontPort)
      status.clear()
    }

    status = statusManager.info('Finalizing')

    if (config.isElectronProcess) {
      autoLauncher.initialize()
    }

    status.clear()

    store.commit('completeBoot')
  } catch (err) {
    if (err instanceof NetworkError) {
      err.log()
      throw new ApplicationBootError('Could not connect to the server, make sure you have a working Internet connection', true, err)
    } else if (err instanceof AuthenticationError) {
      err.logAndReport()
      throw new ApplicationBootError('Server authentication failed, please contact support for help', false)
    } else if (err instanceof RequestError) {
      err.logAndReport()
      throw new ApplicationBootError('Error occurred while booting application', true)
    } else if (err instanceof ServerError) {
      err.log()
      throw new ApplicationBootError('There is a problem with the server, please try again later', true)
    } else if (!(err instanceof ApplicationBootError)) {
      if (err.smart) {
        err.logAndReport()
      } else {
        error(err)
        Raven.captureException(err)
      }
      throw new ApplicationBootError('Failed to start Application')
    } else {
      throw err
    }
  }
}

async function waitForInternet (attempt = 0) {
  const http = new HttpTransport()

  try {
    let response = await http.get('http://httpbin.org/ip')
    if (response.status == 200) {
      return
    }
  } catch (e) {}

  try {
    let response = await http.get('https://api.ipify.org/?format=json')
    if (response.status == 200) {
      return
    }
  } catch (e) {}

  /* Sleep from 2 to 7 seconds */
  await sleep(2000 + Math.min(5000, attempt * 1000))
  return waitForInternet(attempt + 1)
}

