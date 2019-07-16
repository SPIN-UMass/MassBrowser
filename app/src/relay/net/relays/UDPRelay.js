import { ConnectionReceiver } from '@/net/ConnectionReceiver'
import { networkMonitor } from '@/services'
import { debug, info } from '@utils/log'
import * as dgram from 'dgram'
import * as rudp from '../../../common/rudp'

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

  performUDPHolePunching (address, port) {
    return new Promise((resolve, reject) => {
      networkMonitor.stopUDPNATRoutine()
      let holePunchingInterval = setInterval(() => {
        this.server.send(Buffer.from('HELLO'), port, address)
      }, 1000)
      let addressKey = address + port
      this._natPunchingList[addressKey] = {
        isResolved: false,
        holePunchingInterval,
        resolve,
        reject
      }
      setTimeout(() => {
        if (!this._natPunchingList[addressKey].isResolved) {
          clearInterval(holePunchingInterval)
          reject()
          networkMonitor.startUDPNATRoutine()
        }
        networkMonitor.startUDPNATRoutine()
      }, 10000)
    })
  }

  async start () {
    return new Promise((resolve, reject) => {
      this.server = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      this.server.bind({
        port: this.port,
        address: this.address
      })

      this.server.on('message', (message, remoteInfo) => {
        let addressKey = remoteInfo.address + remoteInfo.port
        if (message.toString() === 'HELLO' && this._natPunchingList[addressKey]) {
          let natPunch = this._natPunchingList[addressKey]
          if (!natPunch.isResolved) {
            natPunch.resolve()
            natPunch.isResolved = true
            clearInterval(natPunch.holePunchingInterval)
          }
        } else {
          let connection
          if (!this._connections[addressKey]) {
            connection = new rudp.Connection(new rudp.PacketSender(this.server, remoteInfo.address, remoteInfo.port))
            this._connections[addressKey] = connection
            this._handleConnection(connection, addressKey)
          } else {
            connection = this._connections[addressKey]
          }
          let packet = new rudp.Packet(message)
          if (packet.getIsFinish()) {
            delete this._connections[addressKey]
          } else {
            setImmediate(() => {
              connection.receive(packet)
            })
          }
        }
      })

      let serverStarted
      this.server.on('listening', () => {
        info('UDP relay running on port', this.port)
        serverStarted = true
        resolve(this.server)
      })

      this.server.on('error', (e) => {
        console.log('UDP SERVER ERROR', e)
        if (!serverStarted) {
          reject(e)
        }
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

    // connection.on('error', (err) => {
    //   console.log('socket error', err.message)
    //   this.connectionList.splice(this.connectionList.indexOf(connection), 1)
    //   receiver.closeConnections()
    //   connection.unpipe(upPipe)
    //   downPipe.unpipe(connection)
    //   downPipe.end()
    //   upPipe.end()
    // })

    connection.on('end', () => {
      console.log('socket ending')
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
