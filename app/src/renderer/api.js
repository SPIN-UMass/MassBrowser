
const API_URL = 'http://127.0.0.1:3000/'

class API {
  getRelays() {
    return fetch(API_URL + 'relays')
      .then(response => response.json())
  }
}

const api = new API();
export default api;