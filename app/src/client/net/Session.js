import { EventEmitter } from 'events'
import { connectionManager } from './connectionManager'
import { TCPRelayConnection } from './TCPRelayConnection'
import { DomainConnection } from './DomainConnection'
import { pendMgr } from './PendingConnections'
import { sessionService } from '../services/sessionService'
import { ConnectionTypes } from '../../common/constants'
import UDPRelayConnection from './UDPRelayConnection'

export class Session extends EventEmitter {
  constructor (id, ip, port, desc, allowedCategories, connectionType, domainName) {
    super()

    this.id = id
    this.ip = ip
    this.port = port
    this.desc = desc
    this.allowedCategories = this._initAllowedCategories(allowedCategories)
    this.connection = null
    this.connectionType = connectionType
    this.state = Session.CREATED
    this.domainName = domainName
    this.listenerResolve = {}
    this.listenerReject = {}
    this.bytesSent = 0
    this.bytesReceived = 0
  }

  connect () {
    this.changeState(Session.CONNECTING)

    let relay
    switch (this.connectionType) {
      case ConnectionTypes.TCP_CLIENT:
        relay = new TCPRelayConnection(this.ip, this.port, this.desc)
        break
      case ConnectionTypes.UDP_CLIENT:
        relay = new UDPRelayConnection(this.ip, this.port, this.desc)
        break
      case ConnectionTypes.CDN:
        relay = new DomainConnection(this.domainName, this.desc)
        break
      default:
        relay = new TCPRelayConnection(this.ip, this.port, this.desc)
    }

    relay.id = this.id
    relay.on('data', data => {
      connectionManager.listener(data)
      this.bytesReceived += data.length
      this.emit('receive', data.length)
    })

    relay.on('send', data => {
      this.bytesSent += data.length
      this.emit('send', data.length)
    })

    relay.on('close', () => {
      connectionManager.onRelayClose(relay)
      this.changeState(Session.CLOSED)
      console.log('Calling to remove session')
      sessionService._handleClosedSessions(this)
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
    return new Promise((resolve, reject) => {
      this.changeState(Session.LISTENING)
      pendMgr.addPendingConnection(this)
      this.listenerResolve = resolve
      this.listenerReject = reject
    })
  }

  relayConnected (relay) {
    this.connection = relay
    this.changeState(Session.CONNECTED)
    relay.id = this.id
    relay.on('data', data => {
      connectionManager.listener(data)
      this.bytesReceived += data.length
      this.emit('receive', data.length)
    })

    relay.on('send', data => {
      this.bytesSent += data.length
      this.emit('send', data.length)
    })

    relay.on('close', () => {
      connectionManager.onRelayClose(relay)
      this.changeState(Session.CLOSED)
    })

    relay.sessionFounded(this).then(() => {
      this.listenerResolve()
    }).catch((err) => {
      this.listenerReject(err)
    })
  }

  changeState (state) {
    this.state = state
    this.emit('state-changed', state)
  }

  _initAllowedCategories (allowedCategories) {
    let allowedCategoriesArray = []
    if (allowedCategories) {
      allowedCategories.forEach(cat => {
        allowedCategoriesArray.push(cat.id)
      })
    }
    return new Set(allowedCategoriesArray)
  }

  static get CREATED () { return 'created' }

  static get CONNECTING () { return 'connecting' }

  static get LISTENING () { return 'listening' }

  static get CONNECTED () { return 'connected' }

  static get CLOSED () { return 'closed' }

}
