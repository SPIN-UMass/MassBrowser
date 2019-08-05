import { EventEmitter } from 'events'
import { debug } from '~/utils/log'
import * as dgram from 'dgram'

class UDPNATConnection extends EventEmitter {
  constructor (echoServerAddress, echoServerPort) {
    super()
    this.echoServerAddress = echoServerAddress
    this.echoServerPort = echoServerPort
    this.socket = null
  }

  stop () {
    this.socket.close(() => {
      this.socket = null
    })
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: false })
      this.socket.bind({
        port: 10000 + Math.floor(Math.random() * (65535 - 10000)),
        exclusive: false
      })

      this.socket.send(Buffer.from('TEST'), this.echoServerPort, this.echoServerAddress, (err) => {
        if (err) {
          debug('Failed to send the test message to the Echo server: ', err)
        }
        debug('Test message sent to the Echo server')
      })

      this.socket.on('message', (data, remote) => {
        try {
          data = data.toString()
          this.emit('udp-net-update', {
            remoteAddress: data.split(':')[0],
            remoteUDPPort: Number(data.split(':')[1]),
            localAddress: this.socket.address().address,
            localUDPPort: this.socket.address().port
          })
          resolve()
        } catch (err) {
          debug('Something went wrong while parsing the data,', err)
        }
      })

      this.socket.on('connect', () => {
        debug('UDP Connected to Echo Server')
        this.isConnected = true
      })

      this.socket.on('close', () => {
        debug('UDP Connectivity Server Ended')
        this.isConnected = false
      })

      this.socket.on('error', (err) => {
        debug('UDP Connectivity Server Error', err)
        if (err.code === 'EADDRINUSE') {
          return this.connect()
        } else {
          this.emit('error', err)
        }
      })
    })
  }

  reconnect () {
    if (this.socket) {
      this.socket.close(() => {
        this.socket = null
      })
    }
    return this.connect()
  }

  keepAlive () {
    this.socket.send(Buffer.from('OK'), this.echoServerPort, this.echoServerAddress)
  }
}

export default UDPNATConnection
