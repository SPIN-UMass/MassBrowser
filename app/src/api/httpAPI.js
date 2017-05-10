const API_URL = 'http://nonpiaz.cs.umass.edu:8000/'
// const API_URL = 'http://demo6707596.mockable.io/'
const request = require('request')
const SESSION_URL = '/sessions'
const CLIENT_URL = 'api/client/'
import KVStore from '~/utils/kvstore'

class API {
  constructor () {
    this.jar = request.jar()
    this.sessionid = ''
    var prid = KVStore.getWithDefault('clientid', 'mEJOxpfXi3Q')
    Promise.all([prid]).then((values) => {
      this.clientid = values[0]

    })
  }

  getSessionid () {
    return this.sessionid
  }

  getSessions () {

    return new Promise((resolve, reject) => {
      request.get({
          url: API_URL + CLIENT_URL + this.clientid + '/sessions?limit=50&status=1',
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
            this.sessionid = body['session_key']

            console.log(body, this.sessionid)
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

  clientUp () {
    return new Promise((resolve, reject) => {
        var requestData = {
          'DATA': 'TBD'
        }

        request.post({
            url: API_URL + CLIENT_URL + this.clientid,
            json: true,
            jar: this.jar,
            body: requestData
          },
          function (err, res, body) {
            console.log('clientup', body)
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

  requestSession () {
    return new Promise((resolve, reject) => {
        var requestData = {
          'DATA': 'TBD'
        }

        request.post({
            url: API_URL + CLIENT_URL + this.clientid + SESSION_URL,
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

  register (ip) {
    return new Promise((resolve, reject) => {
        var requestData = {
          'ip': ip
        }

        request.post({
            url: API_URL + 'api/client',
            json: true,
            jar: this.jar,
            body: requestData
          },

          function (err, res, body) {
            console.log(res, body)
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
}

const mock = (data) => {
  return new Promise((resolve, reject) => {
    resolve(data)
  })
}

class MockAPI extends API {
  getLastModificationTime (entity) {
    return mock(1492289721)
  }

  getRelays () {
    return mock([
      {_id: 1, ip: '127.0.0.1', port: 8087}
    ])
  }

  getWebsites (modifiedSince) {
    return mock([
      {_id: 1, name: 'Facebook', category: 1},
      {_id: 2, name: 'Google', category: 1},
      {_id: 3, name: 'Yahoo', category: 1},
      {_id: 4, name: 'Youtube', category: 1}
    ])
  }

  getDomains (modifiedSince) {
    return mock([
      {
        _id: 1,
        name: 'googlevideo.com',
        subdomain: '.*',
        blocked: {
          china: true,
          iran: true
        },
        website: 4,
        cdn: null
      },
      {
        _id: 2,
        name: 'xx.fbcdn.com',
        subdomain: '.*',
        blocked: {
          china: true,
          iran: true
        },
        website: 1,
        cdn: null
      }
    ])
  }

  getCategories (modifiedSince) {
    return mock([
      {_id: 1, name: 'Video Sharing'},
      {_id: 2, name: 'Social Networks'},
      {_id: 3, name: 'Search Engine'}
    ])
  }

  getRegions (modifiedSince) {
    return mock([
      {_id: 1, name: 'china'}
    ])
  }

  getCDNs (modifiedSince) {
    return mock([])
  }
}

const api = new API()
export default api
