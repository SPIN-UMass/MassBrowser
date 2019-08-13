import { ConnectionReceiver } from '@/net/ConnectionReceiver'
import { networkMonitor } from '@/services'
import { warn, debug, info } from '@utils/log'
import udpConnectionService from '@common/services/UDPConnectionService'

export class UDPRelay {
  constructor (authenticator, address, port, upLimit, downLimit) {
    this.authenticator = authenticator
    this.address = address
    this.port = port
    this.upLimit = upLimit
    this.downLimit = downLimit
    this.server = null
    this._connections = {}
    this._natPunchingList = {}
  }

  async start () {
    return new Promise((resolve, reject) => {
      udpConnectionService.on('connection', (connection, addressKey) => {
        this._handleConnection(connection, addressKey)
      })
    })
  }

  async stop () {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this._connections = {}
        this.server.close(() => {
          resolve()
        })
        this.server = null
      })
    }
  }

  _handleConnection (connection, addressKey) {
    let upPipe = this.upLimit.throttle()
    upPipe.on('error', (err) => { debug(err) })
    let downPipe = this.downLimit.throttle()
    downPipe.on('error', (err) => { debug(err) })
    connection.pipe(upPipe)
    downPipe.pipe(connection)
    let receiver = new ConnectionReceiver(upPipe, downPipe, connection, this.authenticator)

    connection.on('finish', () => {
      delete this._natPunchingList[addressKey]
      delete this._connections[addressKey]
      receiver.closeConnections()
      connection.unpipe(upPipe)
      downPipe.unpipe(connection)
      downPipe.end()
      upPipe.end()
    })
  }

  async restart () {
    await this.stop()
    return this.start()
  }
}

export default UDPRelay
