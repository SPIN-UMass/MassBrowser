import { EventEmitter } from 'events'
import { debug } from '~/utils/log'
import * as net from 'net'

export class TCPNATConnection extends EventEmitter {
  constructor (ip, port) {
    super()
    this.ip = ip
    this.port = port

    this._socket = undefined
    this.isConnected = false
  }

  connect () {
    return new Promise((resolve, reject) => {
      let promiseResolved = false
      let socket = this._socket = net.createConnection({
        port: this.port,
        host: this.ip,
        localPort: 10000 + Math.floor(Math.random() * (65535 - 10000)),
        exclusive: false
      })

      socket.on('connect', () => {
        debug('Connected to Echo Server')
        socket.write('TEST')
        socket.setKeepAlive(true)
        this.isConnected = true
      })

      socket.on('data', (data) => {
        data = data.toString()
        let ip = data.split(':')[0]
        let port = data.split(':')[1]

        this.emit('net-update', {
          localIP: socket.localAddress,
          localPort: socket.localPort,
          remoteIP: ip,
          remotePort: port
        })

        if (!promiseResolved) {
          promiseResolved = true
          resolve()
        }
      })

      socket.on('end', () => {
        debug('Connectivity Server Ended')
        this.isConnected = false
        this._socket = null
      })

      socket.on('close', (hadError) => {
        debug('Connectivity Server Ended')
        this.isConnected = false
        this._socket = null
        this.emit('close', hadError)
      })

      socket.on('error', (e) => {
        debug('Connectivity Server Error', e)
        if (e.code === 'EADDRINUSE') {
          return this.connect()
        } else {
          this.emit('error', e)
        }

        if (!promiseResolved) {
          promiseResolved = true
          reject()
        }
      })
    })
  }

  async reconnect () {
    if (this._socket) {
      this._socket.end()
      this._socket = null
      this.isConnected = false
    }

    return this.connect()
  }

  async keepAlive () {
    this._socket.write('OK')
  }
}

export default TCPNATConnection
