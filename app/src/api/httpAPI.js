const API_URL = 'https://yaler.co/'
//const API_URL = 'http://127.0.0.1:8000/'
// const API_URL = 'http://demo6707596.mockable.io/'
const request = require('request')
const SESSION_URL = '/sessions'
const CLIENT_URL = 'api/client/'

import KVStore from '~/utils/kvstore'
import * as errors from '~/utils/errors'

class API {
  constructor () {
    this.jar = request.jar()
    this.sessionID = ''

    // var prid = KVStore.getWithDefault('clientid', 'mEJOxpfXi3Q')
    // Promise.all([prid]).then((values) => {
    //   this.clientid = values[0]
    // })
  }

  getSessionID () {
    return this.sessionID
  }

  getSessions () {

    return new Promise((resolve, reject) => {
      request.get({
          url: API_URL + CLIENT_URL + this.clientID + '/sessions?limit=50&status=1',
          json: true,
          jar: this.jar,
        },
        function (err, res, body) {
          if (err) {
            reject(err)
          } else {
            resolve(body.results)
          }

          // `body` is a js object if request was successful
        })
    })

  }

  getLastModificationTime (entity) {
    return fetch(API_URL + 'api/meta/last_modification_date')
      .then(response => response.text())
      .then(text => new Date(text))
  }

  getWebsites (modifiedSince) {
    return fetch(API_URL + 'api/websites?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  getDomains (modifiedSince) {
    return fetch(API_URL + 'api/domains?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  getCategories (modifiedSince) {
    return fetch(API_URL + 'api/categories?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  getRegions (modifiedSince) {
    return fetch(API_URL + 'api/regions?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  getCDNs (modifiedSince) {
    return fetch(API_URL + 'api/cdns?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  whoAmI () {
    return new Promise((resolve, reject) => {
        var requestData = {}

        request.get({
            url: API_URL + 'api/auth',
            json: true,
            jar: this.jar,
            body: requestData
          },
          function (err, res, body) {
            console.log( body)
            if (err) {
              reject(err)
            } else {
              resolve()
            }

            // `body` is a js object if request was successful
          })
      }
    )
  }

  authenticate (username, password) {
    return new Promise((resolve, reject) => {
        var requestData = {
          'username': username,
          'password': password
        }

        request.post({
            url: API_URL + 'api/auth',
            json: true,
            jar: this.jar,
            body: requestData
          },
          (err, res, body) => {
            
            if (err) {
              reject(new errors.NetworkError(err))
            } else {
              handleResponse(res, body, resolve, reject)
            }
          })
      }
    ).then(body => {
      this.sessionID = body['session_key']
      this.clientID = username
    })
  }

  clientUp () {
    return new Promise((resolve, reject) => {
        var requestData = {
          'categoie': 'TBD'
        }

        request.post({
            url: API_URL + CLIENT_URL + this.clientID,
            json: true,
            jar: this.jar,
            body: requestData
          },
          function (err, res, body) {
            if (err) {
              reject(new errors.NetworkError(err))
            } else {
              handleResponse(res, body, resolve, reject)
            }
          })
      }
    )

  }

  requestSession () {
    return new Promise((resolve, reject) => {
        var requestData = {
          'DATA': 'TBD'
        }
        console.log('sessions request',API_URL + CLIENT_URL + this.clientID + SESSION_URL)
        request.post({
            url: API_URL + CLIENT_URL + this.clientID + SESSION_URL,
            json: true,
            jar: this.jar,
            body: requestData
          },
      function (err, res, body) {
            if (err) {
              reject(new errors.NetworkError(err))
            } else {
              handleResponse(res, body, resolve, reject)
            }
          })
      }
    )
  }

  registerClient (ip) {
    return new Promise((resolve, reject) => {
      var requestData = {
        'ip': ip
      }

        request.post({
            url: API_URL + 'api/clients',
            json: true,
            jar: this.jar,
            body: requestData
          },

          function (err, res, body) {
            if (err) {

              reject(new errors.NetworkError())
            } else {
              handleResponse(res, body, resolve, reject)
            }
          })
      }
    )
  }

  registerRelay () {

    return new Promise((resolve, reject) => {
        var requestData = {
        }
        request.post({
            url: API_URL + 'api/relays',
            json: true,
            jar: this.jar,
            body: requestData
          },

          function (err, res, body) {
            if (err) {
              reject(new errors.NetworkError())
            } else {
              handleResponse(res, body, resolve, reject)
            }
          })
      }
    )
  }
}

function handleResponse(res, body, resolve, reject) {

  if (res.statusCode == 200 || res.statusCode == 201) {
      resolve(body)
    } else if (res.statusCode >= 500) {
      console.log(res)
      reject(new errors.ServerError())
    } else {
      reject(new errors.RequestError(res.statusCode, res.reason))
    }
}



const api = new API()
export default api
