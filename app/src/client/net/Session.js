/**
 * Created by milad on 6/29/17.
 */
import { EventEmitter } from 'events'
import ConnectionManager from '@/net/ConnectionManager'
import RelayConnection from '@/net/RelayConnection'
import DomainConnection from './DomainConnection'
import { pendMgr } from './PendingConnections'

export class Session extends EventEmitter {
  constructor (id, ip, port, desc, allowedCategories, connectionType, domainName) {
    super()

    this.id = id
    this.ip = ip
    this.port = port
    this.desc = desc
    var allowedcats = []

    if (allowedCategories) {
      allowedCategories.forEach(cat => {
        allowedcats.push(cat.id)
      })
    }

    this.allowedCategories = new Set(allowedcats)
    this.connection = null
    this.connectionType = connectionType
    this.state = Session.CREATED
    this.domainName = domainName
    this.listener_resolve = {}
    this.listener_reject = {}
    this.bytesSent = 0
    this.bytesReceived = 0
  }

  connect () {
    this.changeState(Session.CONNECTING)

    if (this.isCDN) {
      var relay = new DomainConnection(this.domainName, this.desc)
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
      this.changeState(Session.CLOSED)
    })

    this.connected = true
    return relay.connect()
      .then(() => {
        this.connection = relay
        this.changeState(Session.CONNECTED)
      })
      .then(() => relay)
  }

  listen () {
    this.changeState(Session.LISTENING)
    pendMgr.addPendingConnection(this)
    return new Promise((resolve, reject) => {
      this.listener_resolve = resolve
      this.listener_reject = reject
    })
  }

  relay_connected (relay) {

    this.connection = relay
    this.changeState(Session.CONNECTED)
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
      this.changeState(Session.CLOSED)

    })



  }

  changeState (state) {
    this.state = state
    this.emit('state-changed', state)
  }

  static get CREATED () { return 'created' }

  static get CONNECTING () { return 'connecting' }

  static get LISTENING () { return 'listening' }

  static get CONNECTED () { return 'connected' }

  static get CLOSED () { return 'closed' }

}
