import { ConnectionAuthenticator, ThrottleGroup } from '../net'
import { ConnectionReceiver } from '../net/ConnectionReceiver'
import { warn, debug } from '@utils/log'
import API from '@/api'
import { store } from '@utils/store'
import { networkMonitor } from '@/services'
import { statusManager } from '@common/services'
import udpConnectionService from '@common/services/UDPConnectionService'
import { ConnectionTypes, UNLIMITED_BANDWIDTH } from '@common/constants'

class RelayManager {
  constructor () {
    this.TCPRelayServer = null
    this.isTCPRelayServerRunning = false
    this.isUDPRelayServerRunning = false
    this.openAccess = false
    this.uploadLimiter = ThrottleGroup({rate: UNLIMITED_BANDWIDTH})
    this.downloadLimiter = ThrottleGroup({rate: UNLIMITED_BANDWIDTH})
    this.authenticator = new ConnectionAuthenticator()

    udpConnectionService.on('relay-new-connection', (connection, addressKey) => {
      udpConnectionService.updateNatPunchingListItem(addressKey)
      this.onNewUDPConnection(connection)
    })
  }

  async restartRelay () {
    const status = statusManager.info('Restarting relay servers...')
    await this.stopRelay()
    await this.startRelay()
    status.clear()
  }

  // handleReconnect () {
  //   if (this.openAccess) {
  //     let publicAddress = this._getReachableAddress()
  //     API.relayUp(publicAddress.ip, publicAddress.port, publicAddress.UDPPort)
  //     this._restartTCPRelayServer()
  //     this._restartUDPRelayServer()
  //   }
  // }

  timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async handleNewRelaySessions (session) {
    debug(`Got new relay session [${session.id}]`)
    let desc = {
      'writekey': (Buffer.from(session.read_key, 'base64')),
      'writeiv': (Buffer.from(session.read_iv, 'base64')),
      'readkey': (Buffer.from(session.write_key, 'base64')),
      'readiv': (Buffer.from(session.write_iv, 'base64')),
      'token': (Buffer.from(session.token, 'base64')),
      'client': session.client,
      'sessionId': session.id
    }

    if (session.connection_type === ConnectionTypes.UDP) {
      this.authenticator.addPendingConnection((desc.token), desc)
      udpConnectionService.createEncryptedConnection(session.reach_client_ip, session.reach_client_main_port, session.token, false)
      udpConnectionService.createEncryptedConnection(session.reach_client_ip, session.reach_client_alt_port, session.token, false)
    }
    
    API.updateSessionStatus(session.id, 'client_accepted')
    debug(`Session [${session.id}] accepted`)

    if (session.reach_client_main_port && session.reach_client_alt_port && session.connection_type === ConnectionTypes.UDP) {
      await this.timeout(3000)
      await udpConnectionService.addExpectedIncomingConnection(session.reach_client_ip)
      await udpConnectionService.performUDPHolePunchingRelay(session.reach_client_ip, session.reach_client_alt_port)
      await this.timeout(3000)
      await udpConnectionService.performUDPHolePunchingRelay(session.reach_client_ip, session.reach_client_main_port)      
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

  // async _stopUDPRelayServer () {
  //   if (this.isUDPRelayServerRunning) {
  //     await udpConnectionService.stop()
  //     this.isUDPRelayServerRunning = false
  //   }
  // }

  // async _stopTCPRelayServer () {
  //   if (this.isTCPRelayServerRunning) {
  //     await this.TCPRelayServer.stop()
  //     this.isTCPRelayServerRunning = false
  //     this.TCPRelayServer = null
  //   }
  // }

  // async _startUDPRelayServer () {
  //   let localAddress = this._getLocalAddress()
  //   await udpConnectionService.setPort(localAddress.UDPPort)
  //   this.isUDPRelayServerRunning = true
  // }

  // async _startTCPRelayServer () {
  //   let localAddress = this._getLocalAddress()
  //   this.TCPRelayServer = new TCPRelay(
  //     this.authenticator,
  //     localAddress.ip,
  //     localAddress.port,
  //     this.uploadLimiter,
  //     this.downloadLimiter
  //   )
  //   await this.TCPRelayServer.start()
  //   this.isTCPRelayServerRunning = true
  // }

  // async _restartUDPRelayServer () {
  //   try {
  //     if (this.isUDPRelayServerRunning) {
  //       await this._stopUDPRelayServer()
  //       debug(`UDP Relay stopped`)
  //     }
  //     await this._startUDPRelayServer()
  //     debug(`UDP Relay started`)
  //   } catch (err) {
  //     warn(err)
  //   }
  // }

  // async _restartTCPRelayServer () {
  //   try {
  //     if (this.isTCPRelayServerRunning) {
  //       await this._stopTCPRelayServer()
  //       debug(`TCP Relay stopped`)
  //     }
  //     await this._startTCPRelayServer()
  //     debug(`Relay started`)
  //   } catch (err) {
  //     warn(err)
  //   }
  // }

  // _getReachableAddress () {
  //   let publicAddress = networkMonitor.getPublicAddress()
  //   store.commit('changePublicAddress', publicAddress)
  //   if (this.natEnabled) {
  //     return {ip: publicAddress.ip, port: publicAddress.port, UDPPort: publicAddress.UDPPort}
  //   }
  //   return {ip: publicAddress.ip, port: this.TCPRelayPort, UDPPort: this.UDPRelayPort}
  // }

  // _getLocalAddress () {
  //   let privateAddress = networkMonitor.getPrivateAddress()
  //   store.commit('changePrivateAddress', privateAddress)
  //   if (this.natEnabled) {
  //     return {ip: privateAddress.ip, port: privateAddress.port, UDPPort: privateAddress.UDPPort}
  //   }
  //   return {ip: '0.0.0.0', port: this.TCPRelayPort, UDPPort: this.UDPRelayPort}
  // }
}

export const relayManager = new RelayManager()
export default relayManager
