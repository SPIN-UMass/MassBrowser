import { ConnectionReceiver } from '@/net/ConnectionReceiver'
import { debug, info } from '@utils/log'
import { relayManager } from '../../services'
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
    this.connectionList = []
  }

  async start () {
    return new Promise((resolve, reject) => {
      this.server = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      this.server.bind({
        port: this.port,
        address: this.address
      })

      let rudpServer = new rudp.Server(this.server)
      rudpServer.on('connection', (connection) => {
        this.connectionList.push(connection)
        let upPipe = this.upLimit.throttle()
        upPipe.on('error', (err) => { debug(err) })
        let downPipe = this.downLimit.throttle()
        downPipe.on('error', (err) => { debug(err) })
        connection.pipe(upPipe)
        downPipe.pipe(connection)
        let receiver = new ConnectionReceiver(upPipe, downPipe, connection, this.authenticator)

        connection.on('error', (err) => {
          console.log('socket error', err.message)
          this.connectionList.splice(this.connectionList.indexOf(connection), 1)
          receiver.closeConnections()
          connection.unpipe(upPipe)
          downPipe.unpipe(connection)
          downPipe.end()
          upPipe.end()
        })

        connection.on('end', () => {
          console.log('socket ending')
          this.connectionList.splice(this.connectionList.indexOf(connection), 1)
          receiver.closeConnections()
          connection.unpipe(upPipe)
          downPipe.unpipe(connection)
          downPipe.end()
          upPipe.end()
        })
      })

      let serverStarted
      this.server.on('listening', () => {
        info('UDP relay running on port', this.port)
        serverStarted = true
        resolve(this.server)
      })

      this.server.on('error', (e) => {
        if (!serverStarted) {
          reject(e)
        }
      })
    })
  }

  async stop () {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.connectionList = []
        this.server.close(() => {
          resolve()
        })
        this.server = null
      })
    }
  }

  async restart () {
    await this.stop()
    return this.start()
  }
}

export function connectToClientUDP (clientAddress, clientPort, token) {
  console.log('Connecting to', clientAddress, clientPort, ' using UDP')
  let socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
  let client = new rudp.Client(socket, clientAddress, clientPort)
  let clientConnection = client.getConnection()

  let myUp = relayManager.uploadLimiter.throttle()
  myUp.on('error', (err) => { debug(err) })
  let myDown = relayManager.downloadLimiter.throttle()

  myDown.on('error', (err) => { debug(err) })
  client.send(token)

  clientConnection.pipe(myUp) // for this again the client needs to be able to stream
  myDown.pipe(clientConnection)

  let receiver = new ConnectionReceiver(myUp, myDown, clientConnection)

  socket.on('error', (err) => {
    console.log('socket error', err.message)
    receiver.closeConnections()
    clientConnection.unpipe(myUp)
    myDown.unpipe(clientConnection)
    myDown.end()
    myUp.end()
  })

  clientConnection.on('end', () => {
    console.log('socket ending')
    receiver.closeConnections()

    clientConnection.unpipe(myUp)
    myDown.unpipe(clientConnection)
    myDown.end()
    myUp.end()
  })
}

export default UDPRelay
