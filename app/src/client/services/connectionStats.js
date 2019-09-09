import { EventEmitter } from 'events'
import { debug, info, warn } from '@utils/log'
import { sessionService } from '@/services'
import {throttleCall} from '@utils'

class ConnectionStats extends EventEmitter {
  constructor () {
    super()
    this.connections = {}
    this._nextConnectionId = 1
  }

  localSocketConnected (socket, address, port) {
    socket.connectionId = this._nextConnectionId++

    const connectionInfo = {
      id: socket.connectionId,
      policy: null,
      address,
      port,
      localConnected: true,
      localSent: 0,
      localReceived: 0,
      remoteConnected: false,
      remoteSent: 0,
      remoteReceived: 0,
      relay: {
        id: null,
        connected: false,
        ip: null,
        port: null
      }
    }
    this.connections[socket.connectionId] = connectionInfo

    this.emit('new-connection', connectionInfo)

    socket.on('data', d => {
      connectionInfo.localSent += d.length
      this.sendUpdate(connectionInfo)
    })

    const write = socket.write.bind(socket)
    socket.write = (d) => {
      write(d)
      connectionInfo.localReceived += d.length
      this.sendUpdate(connectionInfo)
    }

    sessionService.findHostModels(address).then(({category, website}) => {
      connectionInfo.website = website.name
      connectionInfo.category = category.name
      this.sendUpdate(connectionInfo)
    })
  }

  remoteSocketConnected (localSocket, remoteSocket) {
    const connectionInfo = this.connections[localSocket.connectionId];
    if (!connectionInfo) {
      warn('Remote socket connected for non-existing connection')
      return
    }

    remoteSocket.on('connect', () => {
      connectionInfo.remoteConnected = true
      this.sendUpdate(connectionInfo)
    })

    remoteSocket.on('data', d => {
      connectionInfo.remoteSent += d.length
      this.sendUpdate(connectionInfo)
    })

    const write = remoteSocket.write.bind(remoteSocket)
    remoteSocket.write = (d) => {
      write(d)
      connectionInfo.remoteReceived += d.length
      this.sendUpdate(connectionInfo)
    }
  }

  connectionRelayAssigned (localSocket, relay) {
    const connectionInfo = this.connections[localSocket.connectionId];
    if (!connectionInfo) {
      warn('Relay assigned for non-existing connection')
      return
    }

    connectionInfo.relay.id = relay.id
    connectionInfo.relay.ip = relay.relayip
    connectionInfo.relay.port = relay.relayport
    connectionInfo.relay.connected = relay.connected
    this.sendUpdate(connectionInfo)

    relay.on('connect', () => {
      connectionInfo.relay.connected = true
      this.sendUpdate(connectionInfo)
    })

    relay.on('close', () => {
      connectionInfo.relay.connected = false
      this.sendUpdate(connectionInfo)
    })
  }

  sendUpdate (connectionInfo) {
    throttleCall(`update-connection-${connectionInfo.id}`, 500, () => {
      this.emit('updated', connectionInfo.id, connectionInfo)
    })
  }

  async socketPolicyDecided (socket, policy) {
    const connectionInfo = this.connections[socket.connectionId]
    if (!connectionInfo) {
      warn('Policy decided for non-existing connection')
      return
    }

    connectionInfo.policy = policy
    this.sendUpdate(connectionInfo)
  }

  async getConnectionInfo () {
    return Object.values(this.connections)
  }
}

export const connectionStats = new ConnectionStats()
export default connectionStats
