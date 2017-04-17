import API from '../api'
import State from '../state'
import { ConnectionManager, RelayAssigner } from '../../core/client'
import { EventEmitter } from 'events'

class RelayService extends RelayAssigner {
  constructor() {
    super()
    this.relays = []
  }

  start () {
    //ConnectionManager.setRelayAssigner(this)
    this.fetchRelays()
  }

  fetchRelays () {
    API.getRelays()
      .then(relays => {
        this.relays = relays
      })
  }
}

const relayService = new RelayService()
export default relayService
