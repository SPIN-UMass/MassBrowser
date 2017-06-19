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

import * as net from 'net'
const ECHOSERVER= 'yaler.co'
const ECHOPORT= 8823

class WSServerReachability extends EventEmitter {
  constructor () {

    super()
    this.socket=undefined

  }
  connect(){
    return new Promise((resolve,reject)=>{
      this.socket=net.createConnection({port: ECHOPORT, host: ECHOSERVER},()=>{
        console.log('Connected to Echo Server')
        this.socket.write('TEST')

      })
      this.socket.on('data',(data)=>
      {
        data=data.toString()
        console.log(data)
        let ip=data.split(':')[0]
        let port=data.split(':')[1]
        console.log(ip,port)

        resolve([this.localAddress,this.socket.localPort,ip,port])

      })

    })

  }



  keepAlive () {
    return new Promise((resolve, reject) => {
      this.socket.write('OK')
      this.socket.on('drain',resolve)
    })
  }

}
var ConnectivityConnection = new WSServerReachability()
export default ConnectivityConnection