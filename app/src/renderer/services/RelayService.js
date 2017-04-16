import API from '../api'
import State from '../state'

class RelayService {
  start () {
    this.fetchRelays()
  }

  fetchRelays () {
    API.getRelays()
      .then(relays => {
        State.setRelays(relays)
      })
  }
}

const relayService = new RelayService()
export default relayService
