import API from '../api'
import State from '../state'
import { ConnectionManager } from '../../core/client'
import { EventEmitter } from 'events'

/**
 * NOTE: Extending from RelayAssigner produces a strange error, just going with 
 * duck typing for now
 */

class RelayService extends EventEmitter {
  constructor() {
    super()

    this.relays = []
    this.connectedRelays = []
    this.relayConnections = {}
  }

  start () {
    ConnectionManager.setRelayAssigner(this)
    this.fetchRelays()
  }

  assignRelay(ip, port) {
    var relay = this.relays[0]

    if (relay.id in this.relayConnections) {
      return new Promise((resolve, reject) => resolve(this.relayConnections[relay.id]))
    }

    console.debug("Creating new relay connection")
    const desc={'writekey':'12345678123456781234567812345678','writeiv':'a2xhcgAAAAAAAAAA','readkey':'12345678123456791234567812345679','readiv':'a2xhcgAAAAAAAAAB','clientid':String(clientid)};
    return ConnectionManager.newRelayConnection(relay.ip, relay.port, desc)
      .then(relayConnection => {
        this.relayConnections[relay.id] = relayConnection
        this._updateConnectedRelays()
        return relayConnection
      })
  }

  _updateConnectedRelays() {
    return new Promise((resolve, reject) => {
      this.connectedRelays = this.relays.filter(relay => {relay.id in this.relayConnections})
      this.emit('connected-relays-changed', this.connectedRelays)
      resolve()
    })
  }

  getConnectedRelays () {
    return this.connectedRelays
  }

  fetchRelays () {
    return API.getRelays()
      .then(relays => {
        this.relays = relays
      })
  }
}

const relayService = new RelayService()
export default relayService
