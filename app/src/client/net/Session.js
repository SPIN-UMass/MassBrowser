/**
 * Created by milad on 6/29/17.
 */
import { EventEmitter } from 'events'
import Promise from 'bluebird'
import ConnectionManager from '~/client/net/ConnectionManager'
import RelayConnection from '~/client/net/RelayConnection'
import DomainConnection from './DomainConnection'

export class Session extends EventEmitter {
  constructor (id, ip, port, desc, allowedCategories, isCDN) {
    super()

    this.id = id
    this.ip = ip
    this.port = port
    this.desc = desc
    this.allowedCategories = new Set(allowedCategories)
    this.connection = null
    this.isCDN = isCDN || true
    this.connected = false
    this.connecting = false

    this.bytesSent = 0
    this.bytesReceived = 0

  }

  connect () {
    if (this.isCDN) {
      var relay = new DomainConnection(this.ip, this.port, this.desc)
    } else {
      var relay = new RelayConnection(this.ip, this.port, this.desc)
    }
    relay.id = this.id
    relay.on('data', data => {
      ConnectionManager.listener(data)
      this.bytesReceived += data.length
      this.emit('receive', data.length)
    })

    relay.on('send', data => {
      this.bytesSent += data.length
      this.emit('send', data.length)
    })

    relay.on('close', () => {
      ConnectionManager.onRelayClose(relay)

    })

    this.connected = true
    return relay.connect()
      .then(() => {
        this.connection = relay
        this.connected = true
        this.connecting = false
      })
      .then(() => relay)
  }
}
