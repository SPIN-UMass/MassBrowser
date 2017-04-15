import Bus from '../bus'
import API from '../api'
import State from '../state'

class RelayService {
  constructor() {
    
  }

  start() {
    this.fetchRelays()
  }

  fetchRelays() {
    API.getRelays()
      .then(relays => {
        State.setRelays(relays)       
      })
  }
}

const relayService = new RelayService();
export default relayService;