import { EventEmitter } from 'events'
import { debug } from '~/utils/log'
import udpConnectionService from '@common/services/UDPConnectionService'

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
      this.socket = udpConnectionService.getConnection(this.echoServerAddress, this.echoServerPort, true)
      this.socket.send(Buffer.from('TEST'))
      this.socket.on('data', (data) => {
        try {
          data = data.toString()
          this.emit('udp-net-update', {
            remoteAddress: data.split(':')[0],
            remoteUDPPort: Number(data.split(':')[1]),
            localAddress: udpConnectionService.getLocalAddress().address,
            localUDPPort: udpConnectionService.getLocalAddress().port
          })
          resolve()
        } catch (err) {
          debug('Something went wrong while parsing the data,', err)
        }
      })

      this.socket.on('close', () => {
        debug('UDP Connectivity Server Ended')
      })

      this.socket.on('error', (err) => {
        debug('UDP Connectivity Server Error', err)
        this.emit('error', err)
      })
    })
  }

  reconnect () {
    console.log('reconnecting')
    if (this.socket) {
      this.socket.end()
      this.socket = null
    }
    return this.connect()
  }

  keepAlive () {
    this.socket.send(Buffer.from('OK'))
  }
}

export default UDPNATConnection
