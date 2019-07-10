import { EventEmitter } from 'events'
import { info, debug } from '~/utils/log'
import * as dgram from 'dgram'
import API from '@/api'

class UDPConnectivityAPI extends EventEmitter {
  constructor () {
    super()
    this.echoServerAddress = ''
    this.echoServerPort = 0
    this.socket = null
    this.isConnected = false
    this.routineStatus = false
    this.isServerRunning = false
    this.keepAliveInterval = null
  }

  stopRoutine () {
    this.socket.close()
    this.socket = null
    this.routineStatus = false
    this.isConnected = false
    clearInterval(this.keepAliveInterval)
  }

  startRoutine () {
    return new Promise((resolve, reject) => {
      if (this.routineStatus) {
        return
      }
      this.routineStatus = true
      this._startKeepAlive()
      resolve()
    })
  }

  _startKeepAlive () {
    if (this.keepAliveInterval) {
      return
    }
    this.sendKeepAlive()
    this.keepAliveInterval = setInterval(() => this.sendKeepAlive(), 30 * 1000)
  }

  checkStunServer () {
    return new Promise((resolve, reject) => {
      if (this.echoServerPort === 0) {
        API.requestNewStunServer().then((data) => {
          // this.echoServerAddress = data.ip
          // this.echoServerPort = data.port
          this.echoServerAddress = '128.119.245.46'
          this.echoServerPort = 8823
          this.connect()
          resolve()
        })
      }
      resolve()
    })
  }

  sendKeepAlive () {
    this.checkStunServer().then(() => {
      this.socket.send(Buffer.from('TEST'))
    })
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      this.socket.bind({
        port: 10000 + Math.floor(Math.random() * (65535 - 10000)),
        exclusive: false
      }, () => {
        info('UDP socket created')
      })

      this.socket.send(Buffer.from('TEST'), this.echoServerPort, this.echoServerAddress)

      this.socket.on('message', (data, remote) => {
        data = data.toString()
        let natInfo = {
          'remoteAddress': data.split(':')[0],
          'remoteUDPPort': data.split(':')[1],
          'localAddress': this.socket.address().address,
          'localUDPPort': this.socket.address().port
        }
        this.emit('udp-net-update', natInfo)
      })

      this.socket.on('connect', () => {
        debug('UDP Connected to Echo Server')
        this.isConnected = true
      })

      this.socket.on('close', () => {
        debug('UDP Connectivity Server Ended')
        this.isConnected = false
      })

      this.socket.on('error', (e) => {
        debug('UDP Connectivity Server Error', e)
        this.reconnect()
      })

      resolve()
    })
  }

  reconnect () {
    debug('RECONNECTING CONNECTIVITY')
    this.connect().then(() => {
      debug('RECONNECTED CONNECTIVITY')
    })
  }
}

let UDPConnectivityConnection = new UDPConnectivityAPI()
export default UDPConnectivityConnection
