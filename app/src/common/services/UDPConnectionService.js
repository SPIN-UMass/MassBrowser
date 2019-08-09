// import { ConnectionReceiver } from '@/net/ConnectionReceiver'
// import { networkMonitor } from '@/services'
import { warn, debug, info } from '@utils/log'
import * as dgram from 'dgram'
import * as rudp from '../rudp'
// import { UDPRelayConnectionError } from '@utils/errors'

export class UDPConnectionService {
  constructor (authenticator, upLimit, downLimit) {
    this.authenticator = authenticator
    this.upLimit = upLimit
    this.downLimit = downLimit
    this.server = null
    this._connections = {}
    this._isServerRunning = false
    this._natPunchingList = {}
  }

  performUDPHolePunching (address, port) {
    return new Promise((resolve, reject) => {
      let addressKey = address + port
      if (this._natPunchingList[addressKey] && this._natPunchingList[addressKey].isPunched) {
        resolve()
        debug('Client nat already punched')
      } else {
        let connection
        if (!this._connections[addressKey]) {
          connection = new rudp.Connection(new rudp.PacketSender(this.server, address, port))
          this._connections[addressKey] = connection
          connection.once('data', data => {
            if (data.toString() === 'HELLO') {
              let natPunch = this._natPunchingList[addressKey]
              if (!natPunch.isResolved) {
                clearInterval(natPunch.holePunchingInterval)
                clearTimeout(natPunch.timeoutFunction)
                natPunch.isResolved = true
                natPunch.isPunched = true
                natPunch.resolve()
              }
            }
          })
        } else {
          connection = this._connections[addressKey]
        }
        let holePunchingInterval = setInterval(() => {
          connection.send(Buffer.from('HELLO'))
        }, 5000)
        let timeoutFunction = setTimeout(() => {
          if (this._natPunchingList[addressKey] && !this._natPunchingList[addressKey].isResolved) {
            clearInterval(holePunchingInterval)
            reject()
          }
        }, 10000)
        this._natPunchingList[addressKey] = {
          isResolved: false,
          isPunched: false,
          holePunchingInterval,
          resolve,
          timeoutFunction,
          reject
        }
      }
    })
  }

  getLocalAddress () {
    return this.server.address()
  }

  getConnection (address, port) {
    let connection
    let addressKey = address + port
    if (!this._connections[addressKey]) {
      connection = new rudp.Connection(new rudp.PacketSender(this.server, address, port))
      this._connections[addressKey] = connection
    } else {
      connection = this._connections[addressKey]
    }
    return connection
  }

  async start () {
    return new Promise((resolve, reject) => {
      this.server = dgram.createSocket('udp4')
      this.server.bind({
        port: 10000 + Math.floor(Math.random() * (65535 - 10000)),
        exclusive: false
      })

      this.server.on('message', (message, remoteInfo) => {
        let addressKey = remoteInfo.address + remoteInfo.port
        let connection = this.getConnection(remoteInfo.address, remoteInfo.port)
        let packet = new rudp.Packet(message)
        if (packet.getIsFinish()) {
          delete this._connections[addressKey]
        } else {
          setImmediate(() => {
            connection.receive(packet)
          })
        }
      })

      this.server.on('listening', () => {
        info('UDP Connection Service is started', this.port)
        this._isServerRunning = true
        resolve()
      })

      this.server.on('error', (e) => {
        console.log('UDP Connection Service Error: ', e)
        if (!this._isServerRunning) {
          reject(e)
        }
      })
    })
  }

  async stop () {
    return new Promise((resolve, reject) => {
      if (this._isServerRunning) {
        this._connections = {}
        this.server.close(() => {
          resolve()
        })
        this.server = null
      }
    })
  }
  //
  // _handleConnection (connection, addressKey) {
  //   let upPipe = this.upLimit.throttle()
  //   upPipe.on('error', (err) => { debug(err) })
  //   let downPipe = this.downLimit.throttle()
  //   downPipe.on('error', (err) => { debug(err) })
  //   connection.pipe(upPipe)
  //   downPipe.pipe(connection)
  //   let receiver = new ConnectionReceiver(upPipe, downPipe, connection, this.authenticator)
  //
  //   connection.on('finish', () => {
  //     delete this._natPunchingList[addressKey]
  //     delete this._connections[addressKey]
  //     receiver.closeConnections()
  //     connection.unpipe(upPipe)
  //     downPipe.unpipe(connection)
  //     downPipe.end()
  //     upPipe.end()
  //   })
  // }

  async restart () {
    await this.stop()
    return this.start()
  }
}

const udpConnectionService = new UDPConnectionService()
export default udpConnectionService
