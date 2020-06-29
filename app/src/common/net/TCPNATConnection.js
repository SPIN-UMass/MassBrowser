import { EventEmitter } from 'events'
import { debug } from '~/utils/log'
import * as net from 'net'

class TCPNATConnection extends EventEmitter {
  constructor (echoServerAddress, echoServerPort) {
    super()
    this.echoServerAddress = echoServerAddress
    this.echoServerPort = echoServerPort

    this.isConnected = false
    this._socket = undefined
  }

  connect () {
    return new Promise((resolve, reject) => {
      let promiseResolved = false
      this._socket = net.createConnection({
        port: this.echoServerPort,
        host: this.echoServerAddress,
        localPort: 10000 + Math.floor(Math.random() * (65535 - 10000)),
        exclusive: false
      })

      this._socket.on('connect', () => {
        debug('Connected to Echo Server')
        this._socket.write('TEST')
        this._socket.setKeepAlive(true)
        this.isConnected = true
      })

      this._socket.on('data', (data) => {
        data = data.toString()
        this.emit('tcp-net-update', {
          localAddress: this._socket.localAddress,
          localTCPPort: this._socket.localPort,
          remoteAddress: data.split(':')[0],
          remoteTCPPort: Number(data.split(':')[1])
        })

        if (!promiseResolved) {
          promiseResolved = true
          resolve()
        }
      })

      this._socket.on('end', () => {
        debug('Connectivity Server Ended')
        this.isConnected = false
        this._socket = null
      })

      this._socket.on('close', (hadError) => {
        debug('Connectivity Server Ended')
        this.isConnected = false
        this._socket = null
        this.emit('close', hadError)
      })

      this._socket.on('error', (e) => {
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

  reconnect () {
    if (this._socket) {
      this._socket.end()
      this._socket = null
      this.isConnected = false
    }
    return this.connect()
  }

  keepAlive () {
    this._socket.write('OK')
  }
}

export default TCPNATConnection
