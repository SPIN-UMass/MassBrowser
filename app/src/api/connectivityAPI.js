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
var portastic = require('portastic')

class WSServerReachability extends EventEmitter {
  constructor () {

    super()
    this.socket = undefined
    this.isConnected = false
    this.autoConnect = false

  }

  connect () {
    return new Promise((resolve, reject) => {

      this.socket = net.createConnection({
        port: ECHOPORT,
        host: ECHOSERVER,
        localPort: 10000 + Math.floor(Math.random() * (65535 - 10000)),
        exclusive: false
      }, () => {
        console.log('Connected to Echo Server')
        this.socket.write('TEST')
        this.socket.setKeepAlive(true)
        this.isConnected = true
      })
      this.socket.on('data', (data) => {
        data = data.toString()
        //console.log(data)
        let ip = data.split(':')[0]
        let port = data.split(':')[1]
        //console.log(ip,port)
        resolve([this.socket.localAddress, this.socket.localPort, ip, port])

      })
      this.socket.on('end', () => {
        debug('Connectivity Server Ended')
        this.isConnected = false

      })
      this.socket.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {

          this.socket.close()
          this.socket.listen({
            port: ECHOPORT,
            host: ECHOSERVER,
            localPort: 10000 + Math.floor(Math.random() * (65535 - 10000)),
            exclusive: false
          }, () => {
            console.log('Connected to Echo Server')
            this.socket.write('TEST')
            this.socket.setKeepAlive(true)
            this.isConnected = true
          })
        }

      })

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