/**
 * Created by milad on 6/18/17.
 */
/**
 * Created by milad on 4/23/17.
 */
import KVStore from '~/utils/kvstore'
import * as util from 'util'
// const util = require('util')
import { EventEmitter } from 'events'

import { pendMgr } from '~/relay/net/PendingConnections'
import WebSocket from 'ws'
import * as errors from '~/utils/errors'
import { error, debug } from '~/utils/log'

import * as net from 'net'
const ECHOSERVER = 'yaler.co'
const ECHOPORT = 8823

class WSServerReachability extends EventEmitter {
  constructor () {
    super()
    this.socket = undefined
    this.isConnected = false
    this.autoConnect = false
    this.respHandler = {}
    this.errHandler = {}
  }

  connect (resphandler, errorhandler) {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection({
        port: ECHOPORT,
        host: ECHOSERVER,
        localPort: 10000 + Math.floor(Math.random() * (65535 - 10000)),
        exclusive: false
      }, () => {
        debug('Connected to Echo Server')
        this.errHandler = errorhandler
        this.respHandler = resphandler
        this.socket.write('TEST')
        this.socket.setKeepAlive(true)
        this.isConnected = true
        resolve()
      })
      this.socket.on('data', (data) => {
        data = data.toString()
        //console.log(data)
        let ip = data.split(':')[0]
        let port = data.split(':')[1]
        //console.log(ip,port)
        this.respHandler([this.socket.localAddress, this.socket.localPort, ip, port])

      })
      this.socket.on('end', () => {
        debug('Connectivity Server Ended')
        this.isConnected = false

      })
      this.socket.on('close', () => {
        debug('Connectivity Server Ended')
        this.isConnected = false
      })

      this.socket.on('error', (e) => {
        debug('Connectivity Server Error', e)
        if (e.code === 'EADDRINUSE') {

          this.socket.close()
          this.socket.listen({
            port: ECHOPORT,
            host: ECHOSERVER,
            localPort: 10000 + Math.floor(Math.random() * (65535 - 10000)),
            exclusive: false
          }, () => {
            debug('Connected to Echo Server')
            this.socket.write('TEST')
            this.socket.setKeepAlive(true)
            this.isConnected = true
          })
        } else {
          this.errHandler()
        }
      })
    })
  }

  reconnect () {
    debug('RECONNECTING CONNECTIVITY')
    this.connect(this.respHandler, this.errHandler).then(() => {
      debug('RECONNECTED CONNECTIVITY')

    })
  }

  keepAlive () {

    return new Promise((resolve, reject) => {
      //console.log('sending keepalive')
      this.socket.write('OK')
      resolve()
    })
  }

}
var ConnectivityConnection = new WSServerReachability()
export default ConnectivityConnection