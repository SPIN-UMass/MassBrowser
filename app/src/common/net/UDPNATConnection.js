import { EventEmitter } from 'events'
import { debug } from '~/utils/log'
import udpConnectionService from '@common/services/UDPConnectionService'

class UDPNATConnection extends EventEmitter {
  constructor (echoServerAddress, echoServerPort) {
    super()
    this.echoServerAddress = echoServerAddress
    this.echoServerPort = echoServerPort
    this.socket = null
    this.firsttid = null
    this.secondtid = null
    this.secondSocket = null
  }

  stop () {
    this.socket = null
    this.secondSocket = null
  }

  async connect () {
    return new Promise((resolve, reject) => {
      this.socket = udpConnectionService.getConnection(this.echoServerAddress, this.echoServerPort, false)
      this.secondSocket = udpConnectionService.getConnection(this.echoServerAddress, this.echoServerPort, true)
      this.socket.setStunMode()
      if (this.secondSocket) {
        this.secondSocket.setStunMode()
      }
      let secondUDPPort = -1
      let firstUDPPort = -1
      let remoteAddress = null
      let firstPromiseResolve = null
      let secondPromiseResolve = null
      const secondSocketPromise = new Promise((resolve, reject) => {
        if (this.secondSocket) {
          secondPromiseResolve = resolve
        } else {
          resolve()
        }
      })

      const firstSocketPromise = new Promise((resolve, reject) => {
        firstPromiseResolve = resolve
      })

      udpConnectionService.on('stun-data', (tid, data) => {
        if (tid === this.firsttid) {
          firstUDPPort = Number(data.port)
          remoteAddress = data.address
          firstPromiseResolve()
        } else {
          secondUDPPort = Number(data.port)
          remoteAddress = data.address
          secondPromiseResolve()
        }
        this.emit('udp-net-update', {
            remoteSecondUDPPort: secondUDPPort,
            remoteUDPPort: firstUDPPort,
            remoteAddress: remoteAddress,
            localAddress: udpConnectionService.getLocalAddress().address,
            localUDPPort: udpConnectionService.getLocalAddress().port
        })
      })

      this.keepAlive()

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
    this.firsttid = this.socket.sendStunRequest()
    if (this.secondSocket) {
      this.secondtid = this.secondSocket.sendStunRequest()
    }
  }
}

export default UDPNATConnection
