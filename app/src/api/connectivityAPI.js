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

const SESSION_PATH='/api/session/'

const RELAY_PATH= '/api/relays/'
const CLIENT_PATH= '/api/client/'


class WSServerReachability extends EventEmitter {
  constructor () {
    super()
    this.messageID = 0
    this.connectionMap = {}
  }

  connect(sessionid) {
    return new Promise((resolve, reject) => {
      var pip = KVStore.getWithDefault('serverIP', 'yaler.co')
      var pport = KVStore.getWithDefault('serverPort', 443)
      var prid = KVStore.getWithDefault('relayID','mEJOxpfXi3Q')

      Promise.all([pip, pport, prid]).then(values => {
        this.IPaddr = values[0]
        this.port = values[1]
        this.relayid = values[2]

        this.ws = new WebSocket(util.format('wss://%s:%s/api/?session_key=%s', this.IPaddr, this.port, sessionid), {
          perMessageDeflate: false,
        })

        this.ws.on('error', (err) => {
          console.error(err)
        })

        this.ws.on('open', () => {
          this.emit('connected')
        })

        var messageHandlers = {
          reply: m => this.replyReceived(m),
          event: m => this.eventReceived(m),
          auth: m => handleAuth(m)
        }

        this.ws.on('message', (message) => {
          var resp = JSON.parse(message)
          var handler = messageHandlers[resp.type]
          if (handler === undefined) {

            console.error("Invalid message type received from server")
            return
          }
          handler(resp)
        })

        const handleAuth = resp => {
          if (resp.status == 200) {
            resolve(this.ws._socket.localPort)
            this.emit("authenticated")
          } else {
            reject(errors.AuthenticationError(new Error()))
          }
        }
      })
    })
  }

  eventReceived(resp) {
    if (resp.event=== 'new-session') {
      this.onNewSession(resp.data)
    }
  }



  replyReceived(resp) {
    if (resp['message_id'] in this.connectionMap) {
      console.log('I am HERE',this.connectionMap[resp['message_id']])
      this.connectionMap[resp['message_id']](resp['data'])
    }
  }

  sendReceiveJSON(path, method, data, resolve) {
    var proto = {}
    proto['id'] = this.messageID
    proto['data'] = data
    proto['method'] = method
    proto['path'] = path

    this.connectionMap[this.messageID] = resolve
    this.messageID += 1

    var sproto = JSON.stringify(proto)
    // console.log('I am sending with resp' , sproto)
    this.ws.send(sproto)
  }

  sendJSON(path, method, data, resolve) {
    var proto = {}
    proto['id'] = this.messageID
    proto['data'] = data
    proto['method'] = method
    proto['path'] = path
    this.messageID += 1

    var sproto = JSON.stringify(proto)
    // console.log('I am sending', sproto)
    this.ws.send(sproto)
    resolve()
  }

  relayUp (port) {
    return new Promise((resolve, reject) => {

      var proto = {

        'port':port
      }
      this.sendReceiveJSON(RELAY_PATH + this.relayid, 'POST', proto, resolve)
    })
  }

  keepAlive () {
    return new Promise((resolve, reject) => {
      var proto = {
      }
      this.sendJSON(RELAY_PATH + this.relayid, 'POST', proto, resolve)
    })
  }

}
var ConnectivityConnection = new WSServerReachability()
export default ConnectivityConnection