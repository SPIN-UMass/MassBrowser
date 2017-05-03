/**
 * Created by milad on 4/23/17.
 */
import KVStore from '~/utils/kvstore'
const util = require('util')
import { EventEmitter } from 'events'

import { pendMgr } from '../core/relay/PendingConnections'
const WebSocket = require('ws')


const SESSION_PATH='/api/session/'

const RELAY_PATH= '/api/relays/'
const CLIENT_PATH= '/api/client/'


class WSServerConnection extends EventEmitter {
  constructor () {

    super()
    this.messageID=0
    this.connectionMap={}

  }
  connect(sessionid) {
    var pip = KVStore.getWithDefault('serverIP', '127.0.0.1')
    var pport = KVStore.getWithDefault('serverPort', 8000)

    var prid = KVStore.getWithDefault('relayid','mEJOxpfXi3Q')
    Promise.all([pip, pport, prid]).then(values => {
      console.log(values)
      this.IPaddr = values[0]

      this.port = values[1]
      this.relayid = values[2]
      console.log(sessionid)
      this.ws = new WebSocket(util.format('ws://%s:%s/api/?session_key=%s', this.IPaddr, this.port,sessionid), {
        perMessageDeflate: false,


      })
      this.ws.on('open', () => {
        console.log("connecting")
        this.emit('connected')
      })

      this.ws.on('message', (message) => {
        console.log(message)

        var resp = JSON.parse(message)
        if ('type' in resp) {
          if ( resp['type']==='reply') {
            this.replayReceived(resp)
          }
          if (resp['type']==='event') {
            this.eventReceived(resp)
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

    }
    console.log('session',desc,desc.token.length,Buffer.from(data.token,'base64').length)

    pendMgr.addPendingConnection((desc.token),desc)
    this.acceptSession(data.client,data.id)



  }
  acceptSession(client,sessionid) {
    return new Promise((resolve,reject) => {
      var proto = {}


      this.sendJSON(SESSION_PATH+sessionid,'PUT', proto,resolve)

    })
  }

  replayReceived(resp) {
    if (resp['message_id'] in this.connectionMap) {
      console.log('I am HERE',this.connectionMap[resp['message_id']])
      this.connectionMap[resp['message_id']](resp['data'])
    }


  }




  sendReceiveJSON (path,method,data,resolve) {
    var proto = {}
    proto['id']=this.messageID
    proto['data']= data
    proto['method']=method
    proto['path']= path

    this.connectionMap[this.messageID]=resolve
    this.messageID+=1



    var sproto = JSON.stringify(proto)
    console.log('I am sending with resp' , sproto)
    this.ws.send(sproto)
  }
  sendJSON (path,method,data,resolve) {
    var proto = {}
    proto['id']=this.messageID
    proto['data']= data
    proto['method']=method
    proto['path']= path
    this.messageID+=1



    var sproto = JSON.stringify(proto)
    console.log('I am sending', sproto)
    this.ws.send(sproto)
    resolve()
  }

  relayUp (ip, port, nattype) {
    return new Promise((resolve, reject) => {

          var proto = {'ip': ip,
            'port': port,
            'fingerprint': this.fingerprint,
            'bandwidthlimit': KVStore.getWithDefault('bandwidth-limit', -1),
            'natType': nattype,}


          this.sendReceiveJSON(RELAY_PATH+this.relayid,'POST', proto,resolve)

      }
    )
  }



}
var ServerConnection = new WSServerConnection()
export default ServerConnection