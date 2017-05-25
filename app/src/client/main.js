/**
 * Created by milad on 4/11/17.
 */
import { startClientSocks } from './net/ClientSocks'
import ConnectionManager from './net/ConnectionManager'
import RelayConnection from './net/RelayConnection'
import { RandomRelayAssigner } from './net/RelayAssigner'
import SessionManager from './net/SessionManager'
const crypto = require('crypto')
import httpAPI from '~/api/httpAPI'
import KVStore from '~/utils/kvstore'
var schedule = require('node-schedule')
import * as errors from '~/utils/errors'


KVStore.get('client', null)
.then(client => {
  if (client) {
    return client
  } else {
    console.log("Registering Client")
    
    return httpAPI.registerClient()
    .then(client => {
      KVStore.set('client', {id: client.id, password: client.password})
      return {id: client.id, password: client.password}
    })
  }
})
.then(client => {
  console.log("Authenticating Client")
  return httpAPI.authenticate(client.id, client.password)
})
.then(() => {
    var relayAssigner = new RandomRelayAssigner()
    ConnectionManager.setRelayAssigner(relayAssigner)

    schedule.scheduleJob('*/1 * * * * *', () => {httpAPI.getSessions().then((ses => SessionManager.retrivedSessions(ses)  ))})
})
.then(() => {
  console.log("Requesting Session")
  return httpAPI.requestSession() 
})
.then(() => {
  console.log("Server connection established")
  return httpAPI.clientUp()
})
.then(() => {
  console.log("Starting SOCKS server")
  return startClientSocks() 
})
.catch(err => {
  if (err instanceof errors.NetworkError) {
    console.error("Could not connect to the server")
  } else if (err instanceof errors.AuthenticationError) {
    console.error("Authentication failed with server")
  } else if (err instanceof errors.RequestError) {
    console.error("Error occured in request to server " + err.message)
  } else if (err instanceof errors.ServerError) {
    console.error("There is a problem with the server, please try again later")
  } else {
    console.log("Unknown error occured: " + err.toString())
  }
})