/**
 * Created by milad on 4/11/17.
 */
import { startClientSocks } from './net/ClientSocks'
import ConnectionManager from './net/ConnectionManager'
import RelayConnection from './net/RelayConnection'
import { RandomRelayAssigner } from './net/RelayAssigner'
const crypto = require('crypto')
import httpAPI from '~/api/httpAPI'
import KVStore from '~/utils/kvstore'
import * as errors from '~/utils/errors'
import Status from '~/utils/status'
import SessionService from '~/client/services/SessionService'
import CacheProxy from '~/client/cachebrowser/CacheProxy'
import Raven from '~/utils/raven'

// TODO: examine
require('events').EventEmitter.prototype._maxListeners = 10000

export default function bootClient () {
  KVStore.get('client', null)
  .then(client => {
    if (client) {
      return client
    } else {
      let status = Status.info('Registering Client')
      return httpAPI.registerClient()
      .then(client => {
        status.clear()

        KVStore.set('client', {id: client.id, password: client.password})
        return {id: client.id, password: client.password}
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
    return httpAPI.authenticate(client.id, client.password)
    .then(() => { status.clear() })
  })
  .then(() => {
    let status = Status.info('Server connection established')
    return httpAPI.clientUp()
    .then(() => { status.clear() })
  })
  .then(() => {
    return SessionService.start()
  })
  .then(() => {
    let status = Status.info('Starting CacheBrowser server')
    return CacheProxy.startCacheProxy()
      .then(() => { status.clear() })
  })
  .then(() => {
    let status = Status.info('Starting SOCKS server')
    return startClientSocks()
    .then(() => { status.clear() })
  })
  .catch(err => {
    Status.clearAll()

    if (!err.smart) {
      console.log('Unknown error occured:')
      console.error(err)
    } else if (err.is(errors.NetworkError)) {
      Status.error('Could not connect to the server')
      err.log()
    } else if (err.is(errors.AuthenticationError)) {
      Status.error('Server authentication failed')
      err.log()
    } else if (err.is(errors.RequestError)) {
      Status.error('Error occured in request to server ' + err.message)
      err.logAndReport()
    } else if (err.is(errors.ServerError)) {
      Status.error('There is a problem with the server, please try again later')
      err.log()
    }
  })
}
