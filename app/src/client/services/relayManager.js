import { ConnectionAuthenticator, ThrottleGroup } from '@common/net'
import { ConnectionReceiver } from '@/net'
import { warn, debug } from '@utils/log'
import { store } from '@utils/store'
import { networkMonitor } from '@/services'
import { statusManager } from '@common/services'
import { ConnectionTypes, UNLIMITED_BANDWIDTH } from '@common/constants'
import API from '@/api'
import udpConnectionService from '@common/services/UDPConnectionService'

class RelayManager {
  constructor () {
    this.TCPRelayServer = null
    this.isTCPRelayServerRunning = false
    this.isUDPRelayServerRunning = false
    this.openAccess = false
    this.uploadLimiter = ThrottleGroup({rate: UNLIMITED_BANDWIDTH})
    this.downloadLimiter = ThrottleGroup({rate: UNLIMITED_BANDWIDTH})
    this.authenticator = new ConnectionAuthenticator()

    udpConnectionService.on('relay-new-connection', (connection) => {
      // udpConnectionService.updateNatPunchingListItem(addressKey)
      debug('new relay connection')
      this.onNewUDPConnection(connection)
    })
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
      // udpConnectionService.createEncryptedConnection(session.reach_client_ip, session.reach_client_main_port, session.token, false)
      // udpConnectionService.createEncryptedConnection(session.reach_client_ip, session.reach_client_alt_port, session.token, false)
      // await udpConnectionService.addExpectedIncomingConnection(session.reach_client_ip, session.reach_client_main_port)
      // await udpConnectionService.addExpectedIncomingConnection(session.reach_client_ip, session.reach_client_alt_port)
    }
    
    API.updateSessionStatus(session.id, 'client_accepted')
    debug(`Session [${session.id}] accepted`)

    if (session.reach_client_main_port && session.reach_client_alt_port && session.connection_type === ConnectionTypes.UDP) {
      await udpConnectionService.performUDPHolePunchingRelay(session.reach_client_ip, session.reach_client_alt_port, session.token)
      await this.timeout(5000)
      await udpConnectionService.performUDPHolePunchingRelay(session.reach_client_ip, session.reach_client_main_port, session.token)      
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
}

export const relayManager = new RelayManager()
export default relayManager
