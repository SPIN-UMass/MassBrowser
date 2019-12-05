import { EventEmitter } from 'events'
import { debug } from '~/utils/log'
import udpConnectionService from '@common/services/UDPConnectionService'

class UDPNATConnection extends EventEmitter {
  constructor (echoServerAddress, echoServerPort) {
    super()
    this.echoServerAddress = echoServerAddress
    this.echoServerPort = echoServerPort
    this.socket = null
    this.secondSocket = null
  }

  stop () {
    this.socket = null
    this.secondSocket = null
  }

  async connect () {
    return new Promise((resolve, reject) => {
      this.socket = udpConnectionService.getConnection(this.echoServerAddress, this.echoServerPort, true)
      this.secondSocket = udpConnectionService.getConnection(this.echoServerAddress, this.echoServerPort, true, true)
      let secondUDPPort = -1
      let firstUDPPort = -1
      let remoteAddress = null
      const secondSocketPromise = new Promise((resolve, reject) => {
        if (this.secondSocket) {
          this.secondSocket.on('data', (data) => {
            data = data.toString()
            secondUDPPort = Number(data.split(':')[1])
            remoteAddress = data.split(':')[0]
            this.emit('udp-net-update', {
              remoteSecondUDPPort: secondUDPPort,
              remoteUDPPort: firstUDPPort,
              remoteAddress: remoteAddress,
              localAddress: udpConnectionService.getLocalAddress().address,
              localUDPPort: udpConnectionService.getLocalAddress().port
            })
            resolve()
          })
        } else {
          resolve()
        }
      })

      const firstSocketPromise = new Promise((resolve, reject) => {
        this.socket.on('data', (data) => {
          data = data.toString()
          firstUDPPort = Number(data.split(':')[1])
          remoteAddress = data.split(':')[0]
          this.emit('udp-net-update', {
            remoteSecondUDPPort: secondUDPPort,
            remoteUDPPort: firstUDPPort,
            remoteAddress: remoteAddress,
            localAddress: udpConnectionService.getLocalAddress().address,
            localUDPPort: udpConnectionService.getLocalAddress().port
          })
          resolve()
        })
      })

      this.socket.send(Buffer.from('TEST'))
      if (this.secondSocket) {
        this.secondSocket.send(Buffer.from('TEST'))
      }

      this.socket.on('close', () => {
        debug('UDP Connectivity Server Ended')
      })

      this.socket.on('error', (err) => {
        debug('UDP Connectivity Server Error', err)
        this.emit('error', err)
      })

      Promise.all([firstSocketPromise, secondSocketPromise]).then(() => {
        resolve()
      })
    })
  }

  reconnect () {
    return this.connect()
  }

  keepAlive () {
    this.socket.send(Buffer.from('OK'))
    if (this.secondSocket) {
      this.secondSocket.send(Buffer.from('OK'))
    }
  }
}

export default UDPNATConnection
