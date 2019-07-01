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
      let serverSocket = dgram.createSocket('udp4')
      serverSocket.bind({
        port: this.port,
        address: this.address
      })

      this.server = new rudp.Server(serverSocket)
      this.server.on('connection', (connection) => {
        this.connectionList.push(connection) // not sure about this
        let upPipe = this.upLimit.throttle()
        upPipe.on('error', (err) => { debug(err) })
        let downPipe = this.downLimit.throttle()
        downPipe.on('error', (err) => { debug(err) })
        connection.pipe(upPipe) // connection should be stream for doing this
        downPipe.pipe(connection)
        let receiver = new ConnectionReceiver(upPipe, downPipe, connection, this.authenticator)

        // the connection should emit the error I think it is not doing that right now
        connection.on('error', (err) => {
          console.log('socket error', err.message)
          this.connectionList.splice(this.connectionList.indexOf(connection), 1)
          receiver.closeConnections()
          connection.unpipe(upPipe)
          downPipe.unpipe(connection)
          downPipe.end()
          upPipe.end()
        })

        // connection.on('end', () => {
        //   console.log('socket ending')
        //   this.connectionList.splice(this.connectionList.indexOf(socket), 1)
        //   recver.closeConnections()
        //   socket.unpipe(upPipe)
        //   downPipe.unpipe(socket)
        //   downPipe.end()
        //   upPipe.end()
        // })
      })

      let serverStarted
      serverSocket.on('listening', () => {
        info('UDP running on port', this.port)
        serverStarted = true
        resolve(this.server)
      })

      serverSocket.on('error', (e) => {
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

export function connectToClient (clientAddress, clientPort, token) {
  console.log('Connecting to', clientAddress, clientPort, ' using UDP')
  let socket = dgram.createSocket('udp4')
  let client = new rudp.Client(socket, clientAddress, clientPort)

  let myUp = relayManager.uploadLimiter.throttle()
  myUp.on('error', (err) => { debug(err) })
  let myDown = relayManager.downloadLimiter.throttle()
  myDown.on('error', (err) => { debug(err) })

  client.send(token)

  client.pipe(myUp) // for this again the client needs to be able to stream
  myDown.pipe(client)

  let receiver = new ConnectionReceiver(myUp, myDown, client)

  socket.on('error', (err) => {
    console.log('socket error', err.message)
    receiver.closeConnections()
    client.unpipe(myUp)
    myDown.unpipe(client)
    myDown.end()
    myUp.end()
  })
  // socket.on('end', () => {
  //   console.log('socket ending')
  //   receiver.closeConnections()
  //
  //   socket.unpipe(myUp)
  //   myDown.unpipe(socket)
  //   myDown.end()
  //   myUp.end()
  // })
}

export default UDPRelay
