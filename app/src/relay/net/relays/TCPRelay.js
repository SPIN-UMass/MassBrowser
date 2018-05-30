const net = require('net')
import fs from 'fs'
import { ConnectionReceiver } from '@/net/ConnectionReceiver'
import { ThrottleGroup } from '@/net/throttle'
import { debug, info } from '@utils/log'

export class TCPRelay {
  constructor(authenticator, ip, port, upLimit, downLimit) {
    this.authenticator = authenticator
    this.ip = ip
    this.port = port
    this.upLimit = upLimit
    this.downLimit = downLimit
    this._server = null
    this.connection_list=[]
  }

  async start() {
    let server = this._server = net.createServer((socket) => {
      // console.log('relay connected',
      //   socket.authorized ? 'authorized' : 'unauthorized')

      var upPipe = this.upLimit.throttle()
      upPipe.on('error', (err) => {})
      var downPipe = this.downLimit.throttle()
      downPipe.on('error', (err) => {})
      this.connection_list.push(socket)
      socket.pipe(upPipe)
      downPipe.pipe(socket)
  
      var recver = new ConnectionReceiver(upPipe, downPipe, socket, this.authenticator)
      socket.on('error', (err) => {
        console.log('socket error', err.message)
        this.connection_list.splice(this.connection_list.indexOf(socket), 1)
        recver.closeConnections()
        socket.unpipe(upPipe)
        downPipe.unpipe(socket)
        downPipe.end()
        upPipe.end()
      })
      socket.on('end', () => {
        console.log('socket ending')
        this.connection_list.splice(this.connection_list.indexOf(socket), 1)
        recver.closeConnections()
  
        socket.unpipe(upPipe)
        downPipe.unpipe(socket)
        downPipe.end()
        upPipe.end()
      })
    })
    
    return new Promise((resolve, reject) => {
      let serverStarted
      
      server.listen({port: this.port, host: this.ip, exclusive: false}, () => {
        info('TCP relay running on port', this.port)
        serverStarted = true
        resolve(server)
      })

      server.on('error', (e) => {
        if (!serverStarted) {
          reject(e)
        }        
      })
    })
  }

  async stop() {
    if (this._server) {
      return new Promise((resolve, reject) => {
        this.connection_list.forEach((soc,index,arr)=>{
          soc.destroy()
          debug(`killing client soc`)
        })
        this._server.close(() => {
          resolve()
        })
        this._server = null
      })      
    }
  }

  async restart() {
    await this.stop()
    return this.start()
  }
}

export function connectToClient (clientIP, clientPort, token) {
  console.log('Connecting to',clientIP,clientPort)
  const socket = net.connect({host: clientIP, port: clientPort}, (err) => {
    if (err) {
      console.log(err)
    }
    console.log("CONNECTED TO CLIENT")
    var my_up = relayManager.uploadLimiter.throttle()
    my_up.on('error', (err) => {})
    var my_down = relayManager.downloadLimiter.throttle()
    my_down.on('error', (err) => {})

    socket.write(token)
    socket.pipe(my_up)
    my_down.pipe(socket)

    var recver = new ConnectionReceiver(my_up, my_down, socket)
    socket.on('error', (err) => {
      console.log('socket error', err.message)
      recver.closeConnections()
      socket.unpipe(my_up)
      my_down.unpipe(socket)
      my_down.end()
      my_up.end()
    })
    socket.on('end', () => {
      console.log('socket ending')
      recver.closeConnections()

      socket.unpipe(my_up)
      my_down.unpipe(socket)
      my_down.end()
      my_up.end()
    })

  })
}

export default TCPRelay