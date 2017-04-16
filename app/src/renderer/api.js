
// const API_URL = 'http://127.0.0.1:3000/'
const API_URL = 'http://demo6707596.mockable.io/'

class API {
  getRelays () {
    return fetch(API_URL + 'relays')
      .then(response => response.json())
      .then(json => json.relays)
  }

  getLastWebsiteModificationTime () {
    return fetch(API_URL + 'meta/last_website_modification')
      .then(response => response.json())
  }

  getWebsites (modifiedSince) {
    return fetch(API_URL + 'websites?modified_since=' + modifiedSince)
      .then(response => response.json())
      .then(json => json.websites)
  }
}

const api = new API()
export default api
