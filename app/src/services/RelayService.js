import API from '../api/httpAPI'
import { ConnectionManager } from '~/core/client'
import { EventEmitter } from 'events'

/**
 * NOTE: Extending from RelayAssigner produces a strange error, just going with 
 * duck typing for now
 */

export class Relay extends EventEmitter {
  constructor(id, ip, port) {
    super()

    this._id = id
    this.ip = ip
    this.port = port

    this.connected = false
    this.connecting = false

    this.bytesSent = 0
    this.bytesReceived = 0
  }

  addReceivedBytes(size) {
    this.bytesReceived += size
  }

  addSentBytes(size) {
    this.bytesSent += size
  }
}

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

  assignRelay(host, port) {
    // Only support domains
    const ipRegex = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/
    if (ipRegex.test(host)) {
      console.error("IP based filtering not supported")
      return
    }

    Domain.findDomain(host)
      .then(domain => {
        // TODO: Implement Policy Here
      })
    
    var relay = this.relays[0]

    if (relay._id in this.relayConnections) {
      return new Promise((resolve, reject) => resolve(this.relayConnections[relay._id]))
    }

    console.debug("Creating new relay connection")
    const clientid= Buffer.alloc(4);
    const desc={'writekey':'12345678123456781234567812345678','writeiv':'a2xhcgAAAAAAAAAA','readkey':'12345678123456791234567812345679','readiv':'a2xhcgAAAAAAAAAB','clientid':String(clientid)};
    
    relay.connecting = true
    return ConnectionManager.newRelayConnection(relay.ip, relay.port, desc)
      .then(relayConnection => {
        this.relayConnections[relay._id] = relayConnection
        
        relay.connected = true
        relay.connecting = false

        relayConnection.on('data', data => {
          relay.addReceivedBytes(data.length)
        })

        relayConnection.on('send', data => {
          relay.addSentBytes(data.length)
        })
        return relayConnection
      })
  }

  getRelays () {
    return this.relays
  }

  fetchRelays () {
    return API.getRelays()
      .then(relays => {
        this.relays = relays.map(r => new Relay(r._id, r.ip, r.port))
        this.emit('relays-changed', this.relays)
      })
  }
}

const relayService = new RelayService()
export default relayService
