/**
 * Created by milad on 4/11/17.
 */

import { addCertificateToFirefox, setClientVersion } from './firefox'

import crypto from 'crypto'

import Raven from '@utils/raven'
import KVStore from '@utils/kvstore'

import config from '@utils/config'
import { debug, error } from '@utils/log'
import { HttpTransport } from '@utils/transport'

import ConnectivityConnection from '@/net/CloudBasedConnectivityAPI'

import API from '@/api'

import { statusManager, autoLauncher, torService, telegramService } from '@common/services'
import { sessionService, syncService, webPanelService, noHostHandlerService, registrationService } from '@/services'
import { cacheProxy } from '@/cachebrowser'
import { startClientSocks, RelayConnection, RandomRelayAssigner } from '@/net'

import {
  AuthenticationError, NetworkError, RequestError, InvalidInvitationCodeError,
  ServerError, CacheBrowserError, ApplicationBootError
} from '@utils/errors'

import { store } from '@utils/store'

// TODO: examine
require('events').EventEmitter.prototype._maxListeners = 10000

export default async function bootClient () {
  statusManager.clearAll()

  let status

  try {
    await store.ready

    let client = await registrationService.getRegisteredUser()
    if (!client) {
      throw new ApplicationBootError('Client not registered')
    }

    Raven.setUserContext({ id: client.id })

    status = statusManager.info('Authenticating Client')
    let auth = await API.authenticate(client.id, client.password)
    API.transport.setAuthToken(auth.token)
    status.clear()

    status = statusManager.info('Server connection established')
    await API.clientUp()
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

    status = statusManager.info('Connecting to relay')
    await sessionService.start()
    status.clear()

    status = statusManager.info('Starting cachebrowser server')
    await cacheProxy.startCacheProxy()
    status.clear()

    status = statusManager.info('Starting SOCKS server')
    await startClientSocks('127.0.0.1', config.socksPort)
    status.clear()

    status = statusManager.info('Starting Connectivity Monitor')
    await ConnectivityConnection.startRoutine()
    status.clear()

    status = statusManager.info('Starting remaining services')
    await Promise.all([webPanelService.start(), noHostHandlerService.start()])
    status.clear()

    if (await syncService.isFirstSync()) {
      debug('It is first boot, syncing database')
      status = statusManager.info('Syncing database')
      await syncService.syncAll()
      status.clear()
    }

    status = statusManager.info('Checking browser availability')
    await setClientVersion()
    status.clear()
    if (store.state.isFirefoxIncluded) {
      status = statusManager.info('Installing the Cert')
      await addCertificateToFirefox()
      status.clear()
    }

    status = statusManager.info('Finalizing')
    autoLauncher.initialize()
    status.clear()

    await store.commit('completeBoot')
  } catch (err) {
    handleBootError(err)
  }
}

function handleBootError (err) {
  if (err instanceof AuthenticationError) {
    err.logAndReport()
    throw new ApplicationBootError('Server authentication failed, please contact support for help', false)
  } else if (err instanceof NetworkError) {
    err.log()
    throw new ApplicationBootError('Could not connect to the server, make sure you have a working Internet connection', true, err)
  } else if (err instanceof RequestError) {
    err.logAndReport()
    throw new ApplicationBootError('Error occured while booting application', true)
  } else if (err instanceof CacheBrowserError) {
    err.logAndReport()
    throw new ApplicationBootError('Failed to start the CacheBrowser proxy server', true)
  } else if (err instanceof ServerError) {
    err.log()
    throw new ApplicationBootError('There is a problem with the server, please try again later', true)
  } else if (!(err instanceof ApplicationBootError || err instanceof InvalidInvitationCodeError)) {
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
