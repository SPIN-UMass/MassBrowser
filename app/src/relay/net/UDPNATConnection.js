import { EventEmitter } from 'events'
import { debug } from '~/utils/log'
import * as dgram from 'dgram'

export class UDPNATConnection extends EventEmitter {
  constructor (echoServerAddress, echoServerPort) {
    super()
    this.echoServerAddress = echoServerAddress
    this.echoServerPort = echoServerPort
    this.socket = null
  }

  connect () {
    return new Promise((resolve, reject) => {
      let promiseResolved = false
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      this.socket.bind(10000 + Math.floor(Math.random() * (65535 - 10000)))
      this.socket.send(Buffer.from('TEST'), this.echoServerPort, this.echoServerAddress, (err) => {
        if (err) {
          debug('Failed to send the test message to the Echo server: ', err)
        }
        debug('Test message sent to the Echo server')
      })

      this.socket.on('message', (data) => {
        try {
          data = data.toString()
          let remoteAddress = data.split(':')[0]
          let remotePort = data.split(':')[1]

          this.emit('udp-net-update', {
            localAddress: this.socket.address().address,
            localUDPPort: this.socket.address().port,
            remoteAddress: remoteAddress,
            remoteUDPPort: remotePort
          })

          if (!promiseResolved) {
            promiseResolved = true
            resolve()
          }
        } catch (err) {
          debug('Something went wrong while parsing the data,', err)
        }
      })

      this.socket.on('error', (err) => {
        debug('UDP Connectivity Server Error', err)
        if (err.code === 'EADDRINUSE') {
          return this.connect()
        } else {
          this.emit('error', err)
        }

        if (!promiseResolved) {
          promiseResolved = true
          reject()
        }
      })
    })
  }

  async reconnect () {
    if (this.socket) {
      this.socket.close(() => {
        this.socket = null
      })
    }
    return this.connect()
  }

  async keepAlive () {
    this.socket.send(Buffer.from('OK'), this.echoServerPort, this.echoServerAddress)
  }
}

export default UDPNATConnection
