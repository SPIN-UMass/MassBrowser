import { TCPRelay, ConnectionAuthenticator, ThrottleGroup } from '@/net'
import { warn, debug } from '@utils/log'
import API from '@/api'
import { store } from '@utils/store'
import { networkMonitor } from '@/services'
import { statusManager } from '@common/services'
import { ConnectionTypes, UNLIMITED_BANDWIDTH } from '@common/constants'
import udpConnectionService from '@common/services/UDPConnectionService'
import {ConnectionReceiver} from '../net/ConnectionReceiver'

/**
 * Manages the relay servers.
 *
 * You can start/stop the relay and change upload and download
 * bandwidth limits
 */

class RelayManager {
  constructor () {
    this.TCPRelayServer = null
    this.isTCPRelayServerRunning = false
    this.isUDPRelayServerRunning = false
    this.openAccess = false

    store.ready.then(() => {
      this.natEnabled = store.state.natEnabled
      this.TCPRelayPort = store.state.TCPRelayPort
      this.UDPRelayPort = store.state.UDPRelayPort
      this.uploadLimit = store.state.uploadLimit
      this.downloadLimit = store.state.downloadLimit
      this.bandwidthLimited = this.uploadLimit !== 0 || this.downloadLimit !== 0
      this.uploadLimiter = ThrottleGroup({rate: this.uploadLimit || UNLIMITED_BANDWIDTH})
      this.downloadLimiter = ThrottleGroup({rate: this.downloadLimit || UNLIMITED_BANDWIDTH})
      this.authenticator = new ConnectionAuthenticator()

      if (this.natEnabled) {
        debug('NAT mode is enabled')
      } else {
        debug(`NAT mode is not enabled, running relay on port: ${this.TCPRelayPort}`)
      }
    })

    udpConnectionService.on('relay-new-connection', (connection, addressKey) => {
      console.log('RELAY NEW CONNECTION')
      udpConnectionService.updateNatPunchingListItem(addressKey)
      this.onNewUDPConnection(connection)
    })
  }

  setUploadLimit (limitBytes) {
    this.uploadLimit = limitBytes * 8
    store.commit('changeUploadLimit', limitBytes)
    this.uploadLimiter.resetRate({rate: this.uploadLimit || UNLIMITED_BANDWIDTH})
  }

  setDownloadLimit (limitBytes) {
    this.downloadLimit = limitBytes * 8
    store.commit('changeDownloadLimit', limitBytes)
    this.downloadLimiter.resetRate({rate: this.downloadLimit || UNLIMITED_BANDWIDTH})
  }

  changeNatStatus (natEnabled, restartRelay = true) {
    this.natEnabled = natEnabled
    store.commit('changeNatStatus', natEnabled)
    if (restartRelay) {
      this.restartRelay()
    }
  }

  setTCPRelayPort (port, restartRelay = true) {
    this.TCPRelayPort = port
    store.commit('changeTCPRelayPort', port)
    if (restartRelay) {
      this.restartRelay()
    }
  }

  setUDPRelayPort (port, restartRelay = true) {
    this.UDPRelayPort = port
    store.commit('changeUDPRelayPort', port)
    if (restartRelay) {
      this.restartRelay()
    }
  }

  async changeAccess (access) {
    if (access === this.openAccess) {
      return
    }
    warn('change access has been changed')

    this.openAccess = access
    store.commit('changeOpenAccess', this.openAccess)

    if (this.openAccess) {
      let publicAddress = this._getReachableAddress()
      API.relayUp(publicAddress.ip, publicAddress.port, publicAddress.UDPPort)
      warn('restarting the relays!')
      await this._restartTCPRelayServer()
      await this._restartUDPRelayServer()
      statusManager.info(`TCP Relay server started on port ${publicAddress.port}`, { timeout: true })
      statusManager.info(`UDP Relay server started on port ${publicAddress.UDPPort}`, { timeout: true })
    } else {
      API.relayDown()
      await this._stopTCPRelayServer()
      await this._stopUDPRelayServer()
    }
  }

  async startRelay () {
    await this.changeAccess(true)
  }

  async stopRelay () {
    await this.changeAccess(false)
  }

  async restartRelay () {
    const status = statusManager.info('Restarting relay servers...')
    await this.stopRelay()
    await this.startRelay()
    status.clear()
  }

  handleReconnect () {
    if (this.openAccess) {
      let publicAddress = this._getReachableAddress()
      API.relayUp(publicAddress.ip, publicAddress.port, publicAddress.UDPPort)
      this._restartTCPRelayServer()
      this._restartUDPRelayServer()
    }
  }

  timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async onNewSessionEvent (data) {
    let desc = {
      'writekey': (Buffer.from(data.read_key, 'base64')),
      'writeiv': (Buffer.from(data.read_iv, 'base64')),
      'readkey': (Buffer.from(data.write_key, 'base64')),
      'readiv': (Buffer.from(data.write_iv, 'base64')),
      'token': (Buffer.from(data.token, 'base64')),
      'client': data.client,
      'connectiontype': data.connection_type,
      'sessionId': data.id
    }

    debug(`New session [${data.id}] received for client [${data.client.id}]`)
    if (desc.connectiontype === ConnectionTypes.TCP_CLIENT || desc.connectiontype === ConnectionTypes.UDP) {
      this.authenticator.addPendingConnection((desc.token), desc)
    }

    if (desc.connectiontype === ConnectionTypes.UDP) {
      debug('created connection object for udp session')
      udpConnectionService.createEncryptedConnection(data.client.ip, data.client.udp_port, data.token, false)
      // udpConnectionService.createEncryptedConnection(data.client.ip, data.client.udp_port, desc.token)
    }


    if (data.main_port && data.alt_port && data.connection_type === ConnectionTypes.UDP) {
      debug(' Got a new reach test doing nothing for now')
      return;
      // await udpConnectionService.performUDPHolePunchingRelay('54.145.75.108', data.alt_port)
      // await this.timeout(3000)
      // await udpConnectionService.performUDPHolePunchingRelay('54.145.75.108', data.main_port)      
    }
    API.acceptSession(data.client, data.id)

    if (data.client.ip && desc.connectiontype === ConnectionTypes.UDP) {
      await udpConnectionService.addExpectedIncomingConnection(data.client.ip)
      await udpConnectionService.performUDPHolePunchingRelay(data.client.ip, data.client.udp_alt_port)
      await this.timeout(3000)
      await udpConnectionService.performUDPHolePunchingRelay(data.client.ip, data.client.udp_port)
    }
  }

  onNewUDPConnection (connection) {
    let upPipe = this.uploadLimiter.throttle()
    upPipe.on('error', (err) => { debug(err) })
    let downPipe = this.downloadLimiter.throttle()
    downPipe.on('error', (err) => { debug(err) })
    connection.on('data', data => {
      upPipe.write(data)
    })

    downPipe.on('data', data => {
      connection.write(data)
    })

    let receiver = new ConnectionReceiver(upPipe, downPipe, connection, this.authenticator)

    connection.on('close', () => {
      receiver.closeConnections()
      connection.unpipe(upPipe)
      downPipe.unpipe(connection)
      downPipe.end()
      upPipe.end()
    })
  }

  async _stopUDPRelayServer () {
    if (this.isUDPRelayServerRunning) {
      await udpConnectionService.stop()
      this.isUDPRelayServerRunning = false
    }
  }

  async _stopTCPRelayServer () {
    if (this.isTCPRelayServerRunning) {
      await this.TCPRelayServer.stop()
      this.isTCPRelayServerRunning = false
      this.TCPRelayServer = null
    }
  }

  async _startUDPRelayServer () {
    let localAddress = this._getLocalAddress()
    await udpConnectionService.setPort(localAddress.UDPPort)
    this.isUDPRelayServerRunning = true
  }

  async _startTCPRelayServer () {
    let localAddress = this._getLocalAddress()
    this.TCPRelayServer = new TCPRelay(
      this.authenticator,
      localAddress.ip,
      localAddress.port,
      this.uploadLimiter,
      this.downloadLimiter
    )
    await this.TCPRelayServer.start()
    this.isTCPRelayServerRunning = true
  }

  async _restartUDPRelayServer () {
    try {
      if (this.isUDPRelayServerRunning) {
        await this._stopUDPRelayServer()
        debug(`UDP Relay stopped`)
      }
      await this._startUDPRelayServer()
      debug(`UDP Relay started`)
    } catch (err) {
      warn(err)
    }
  }

  async _restartTCPRelayServer () {
    try {
      if (this.isTCPRelayServerRunning) {
        await this._stopTCPRelayServer()
        debug(`TCP Relay stopped`)
      }
      await this._startTCPRelayServer()
      debug(`Relay started`)
    } catch (err) {
      warn(err)
    }
  }

  _getReachableAddress () {
    let publicAddress = networkMonitor.getPublicAddress()
    store.commit('changePublicAddress', publicAddress)
    if (this.natEnabled) {
      return {ip: publicAddress.ip, port: publicAddress.port, UDPPort: publicAddress.UDPPort}
    }
    return {ip: publicAddress.ip, port: this.TCPRelayPort, UDPPort: this.UDPRelayPort}
  }

  _getLocalAddress () {
    let privateAddress = networkMonitor.getPrivateAddress()
    store.commit('changePrivateAddress', privateAddress)
    if (this.natEnabled) {
      return {ip: privateAddress.ip, port: privateAddress.port, UDPPort: privateAddress.UDPPort}
    }
    return {ip: '0.0.0.0', port: this.TCPRelayPort, UDPPort: this.UDPRelayPort}
  }
}

export const relayManager = new RelayManager()
export default relayManager
