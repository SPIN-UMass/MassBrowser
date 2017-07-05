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


class WSServerConnection extends EventEmitter {
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
            resolve()
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

  onNewSession(data) {

    var desc = {
      'writekey': (Buffer.from(data.read_key,'base64')),
      'writeiv': (Buffer.from(data.read_iv,'base64')),
      'readkey': (Buffer.from(data.write_key,'base64')),
      'readiv': (Buffer.from(data.write_iv,'base64')),
      'token': (Buffer.from(data.token,'base64')),
      'client': data.client,
      'sessionId': data.id

    }
    console.log('session',desc,desc.token.length,Buffer.from(data.token,'base64').length)

    pendMgr.addPendingConnection((desc.token),desc)
    this.acceptSession(data.client,data.id)
  }

  acceptSession(client,sessionid) {
    return new Promise((resolve,reject) => {
      var proto = {
        status: 'accepted'
      }

      this.sendJSON(SESSION_PATH+sessionid+'/status','PUT', proto,resolve)

    })
  }

  clientSessionConnected(client,sessionid) {
    return new Promise((resolve,reject) => {
      var proto = {
        status: 'used'
      }
      console.log("USED CONNECTION")
      this.sendJSON(SESSION_PATH+sessionid+'/status','PUT', proto,resolve)

    })
  }
  clientSessionDisconnected(client,sessionid) {
    console.log('closing session')
    return new Promise((resolve,reject) => {
      // TODO

      resolve()
      // var proto = {
        
      // }


      // this.sendJSON(SESSION_PATH+sessionid+'/status','PUT', proto,resolve)

    })
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
  relayUp (ip, port) {
    return new Promise((resolve, reject) => {
      var proto = {
        'ip': ip,
        'port': port,
        'fingerprint': this.fingerprint,
        'bandwidthlimit': KVStore.getWithDefault('bandwidth-limit', -1),
      }
      this.sendReceiveJSON(RELAY_PATH + this.relayid, 'POST', proto, resolve)
    })
  }

  keepAlive () {
      return new Promise((resolve, reject) => {
        var proto = {
          'fingerprint': this.fingerprint,
        }
        this.sendJSON(RELAY_PATH + this.relayid, 'POST', proto, resolve)
      })
  }


}
var ServerConnection = new WSServerConnection()
export default ServerConnection