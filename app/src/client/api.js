
// const API_URL = 'http://127.0.0.1:3000/'
const API_URL = 'http://demo6707596.mockable.io/'

class API {
  getRelays () {
    return fetch(API_URL + 'relays')
      .then(response => response.json())
      .then(json => json.relays)
  }

  getLastModificationTime (entity) {
    return fetch(API_URL + 'meta/last_modification/' + entity)
      .then(response => response.json())
  }

  getWebsites (modifiedSince) {
    return fetch(API_URL + 'websites?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  getDomains (modifiedSince) {
    return fetch(API_URL + 'domains?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  getCategories (modifiedSince) {
    return fetch(API_URL + 'categories?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  getRegions (modifiedSince) {
    return fetch(API_URL + 'regions?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
  }

  getCDNs (modifiedSince) {
    return fetch(API_URL + 'cdns?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.results)
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

const api = new MockAPI()
export default api
