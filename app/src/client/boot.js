/**
 * Created by milad on 4/11/17.
 */


import crypto from 'crypto'

import Raven from '@utils/raven'
import KVStore from '@utils/kvstore'

import config from '@utils/config'
import { debug, error } from '@utils/log'
import { HttpTransport } from '@utils/transport'

import ConnectivityConnection from '@/net/CloudBasedConnectivityAPI'

import API from '@/api'

import Status from '@common/services/StatusService'
import SessionService from '@/services/SessionService'
import SyncService from '@/services/SyncService'
import WebPanelService from '@/services/WebPanelService'
import NoHostHandlerService from '@/services/NoHostHandlerService'
import CacheProxy from '@/cachebrowser/CacheProxy'

import { startClientSocks } from '@/net/ClientSocks'
import ConnectionManager from '@/net/ConnectionManager'
import RelayConnection from '@/net/RelayConnection'
import { RandomRelayAssigner } from '@/net/RelayAssigner'

import {
  AuthenticationError, NetworkError, RequestError, InvalidInvitationCodeError,
  ServerError, CacheBrowserError, ApplicationBootError
} from '@utils/errors'

import { store } from '@utils/store'

// TODO: examine
require('events').EventEmitter.prototype._maxListeners = 10000

export default async function bootClient () {
  Status.clearAll()

  let status

  try {
    let client = store.state.client
    if (!client) {
      throw new ApplicationBootError('Client not registered')
    }

    Raven.setUserContext({ id: client.id })

    status = Status.info('Authenticating Client')
    let auth = await API.authenticate(client.id, client.password)
    API.transport.setAuthToken(auth.token)
    status.clear()

    status = Status.info('Server connection established')
    await API.clientUp()
    status.clear()

    status = Status.info('Connecting to relay')
    await SessionService.start()
    status.clear()

    status = Status.info('Starting cachebrowser server')
    await CacheProxy.startCacheProxy()
    status.clear()

    status = Status.info('Starting SOCKS server')
    await startClientSocks('127.0.0.1', config.socksPort)
    status.clear()

    status = Status.info('Starting Connectivity Monitor')
    await ConnectivityConnection.startRoutine()
    status.clear()

    status = Status.info('Starting remaining services')
    await Promise.all([WebPanelService.start(), NoHostHandlerService.start()])
    status.clear()

    if (await SyncService.isFirstSync()) {
      debug('It is first boot, syncing database')
      status = Status.info('Syncing database')
      await SyncService.syncAll()
      status.clear()
    }

    await store.commit('completeBoot')

  } catch (err) {
    handleBootError(err) 
  }
}

function handleBootError(err) {
  if (err instanceof AuthenticationError) {
    err.logAndReport()
    throw new ApplicationBootError('Server authentication failed, please contact support for help', false)
  } else if (err instanceof NetworkError) {
    err.log()
    throw new ApplicationBootError('Could not connect to the server, make sure you have a working Internet connection', true)
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
  }
}