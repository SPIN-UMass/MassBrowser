/**
 * Created by milad on 4/23/17.
 */
import KVStore from '~/utils/kvstore'
const util = require('util')
import { EventEmitter } from 'events'
const relayPath= '/relays'
const WebSocket = require('ws')

class WSServerConnection extends EventEmitter {
  constructor () {

    super()
    this.messageID=0
    this.connectionMap={}

  }
  connect(sessionid) {
    var pip = KVStore.getWithDefault('serverIP', '127.0.0.1')
    var pport = KVStore.getWithDefault('serverPort', 8000)

    var pfinger = KVStore.get('serverFingerprint')
    Promise.all([pip, pport, pfinger]).then(values => {
      console.log(values)
      this.IPaddr = values[0]

      this.port = values[1]
      this.fingerprint = values[2]
      console.log(sessionid)
      this.ws = new WebSocket(util.format('ws://%s:%s/relay/?session_key=%s', this.IPaddr, this.port,sessionid), {
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

  }

  replayReceived(resp) {
    if (resp['id'] in this.connectionMap) {
      this.connectionMap[resp['id']](resp['data'])
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
    console.log('I am sending', sproto)
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
    return Promise((resolve, reject) => {
        if (this.fingerprint === null) {
          this.register(ip, port).then(() => {this.relayUp(ip, port).then(resolve, reject)})
        } else {
          var proto = {'ip': ip,
            'port': port,
            'fingerprint': this.fingerprint,
            'bandwidthlimit': KVStore.getWithDefault('bandwidth-limit', -1),
            'natType': nattype,}


          this.sendJSON(relayPath,'post', proto,resolve)
        }
      }
    )
  }

  register (ip, port, nattype) {
    return Promise((resolve, reject) => {
      var proto = {
        'cmd': 'register',
        'ip': ip,
        'port': port,
        'bandwidthlimit': KVStore.getWithDefault('bandwidth-limit', -1),
        'natType': nattype,
      }
      this.on('registered', (data) => {
        KVStore.set('fingerprint', data.fingerprint)
        this.fingerprint = data.fingerprint
        resolve()
      })

      this.sendJSON(proto)
    })
  }

}
var ServerConnection = new WSServerConnection()
export default ServerConnection