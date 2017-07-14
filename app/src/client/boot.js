/**
 * Created by milad on 4/11/17.
 */


import crypto from 'crypto'

import Raven from '~/utils/raven'
import KVStore from '~/utils/kvstore'
import Status from '~/utils/status'
import config from '~/utils/config'
import { debug, error } from '~/utils/log'
import { HttpTransport } from '~/utils/transport'

import API from '~/client/api'

import SessionService from '~/client/services/SessionService'
import SyncService from '~/client/services/SyncService'
import CacheProxy from '~/client/cachebrowser/CacheProxy'

import { startClientSocks } from './net/ClientSocks'
import ConnectionManager from './net/ConnectionManager'
import RelayConnection from './net/RelayConnection'
import { RandomRelayAssigner } from './net/RelayAssigner'

import {
  AuthenticationError, NetworkError, RequestError, InvalidInvitationCodeError,
  ServerError, CacheBrowserError, ApplicationBootError
} from '~/utils/errors'

// TODO: examine
require('events').EventEmitter.prototype._maxListeners = 10000

/**
 * @param registrationCallback is called if the client requires registration, the callback is
 * expected to return a promise which provides an invitation code used for registration
 * 
 * * @param registrationCallback is called if the client requires registration, the callback is
 * expected to return a promise which provides an invitation code used for registration
 *
 * @throws ApplicationBootError
 * @throws InvalidInvitationCodeError
 */
export default function bootClient (registrationCallback, updateAvailableCallback) {
  Status.clearAll()

  return KVStore.get('client', null)
    .then(client => {
      if (client) {
        return client
      } else {
        return registrationCallback()
          .then(invitationCode => {
            let status = Status.info(`Registering Client`)
            return API.registerClient(invitationCode)
              .then(client => {
                status.clear()
                KVStore.set('client', {id: client.id, password: client.password})
                return {id: client.id, password: client.password}
              })
          })

      }
    })
    .then(client => {
      Raven.setUserContext({
        id: client.id
      })
      return client
    })
    .then(client => {
      let status = Status.info('Authenticating Client')
      return API.authenticate(client.id, client.password)
        .then(auth => API.transport.setAuthToken(auth.token))
        .then(() => status.clear())
    })
    .then(() => {
      let status = Status.info('Server connection established')
      return API.clientUp()
        .then(() => status.clear())
    })
    .then(() => {
      let status = Status.info('Connecting to relay')
      return SessionService.start()
        .then(() => status.clear())
    })
    .then(() => {
      let status = Status.info('Starting cachebrowser server')
      return CacheProxy.startCacheProxy()
        .then(() => status.clear())
    })
    .then(() => {
      let status = Status.info('Starting SOCKS server')
      return startClientSocks('127.0.0.1', config.client.socksPort)
        .then(() => status.clear())
    })
    .then(() => {
      /// Only sync database in boot if it is the first time booting
      /// otherwise sync will after the client has started to avoid
      /// having delay on each run
      return SyncService.isFirstSync()
        .then(firstSync => {
          if (firstSync) {
            debug('It is first boot, syncing database')
            let status = Status.info('Syncing database')
            return SyncService.syncAll()
              .then(() => status.clear())
          }
        })
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
    .catch(CacheBrowserError, err => {
      err.logAndReport()
      throw new ApplicationBootError('Failed to start the CacheBrowser proxy server', true)
    })
    .catch(ServerError, err => {
      err.log()
      throw new ApplicationBootError('There is a problem with the server, please try again later', true)
    })
    .catch(err => !(err instanceof ApplicationBootError || err instanceof InvalidInvitationCodeError), err => {
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