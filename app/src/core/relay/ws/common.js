/**
 * Created by milad on 4/23/17.
 */
import KVStore from '~/utils/kvstore'
const util = require('util')
import { EventEmitter } from 'events'

const WebSocket = require('ws')

class WSServerConnection extends EventEmitter {
  constructor () {
    super()
    this.IPaddr = KVStore.getWithDefault('serverIP', '127.0.0.1')
    this.port = KVStore.getWithDefault('serverPort', '8000')
    this.fingerprint = KVStore.get('fingerprint')
    this.ws = new WebSocket(util.format('ws://%s:%s/', this.IPaddr, this.port), {
      perMessageDeflate: false

    })
    this.ws.on('message', (message) => {
      resp=JSON.parse(message)
      if (resp.relay) {
        this.emit(resp.relay.respcmd,resp.relay)
      }

    })

  }
  authenticate(){

  }

  sendJSON(proto)
  {
    var sproto = JSON.stringify(proto)

    this.ws.send(sproto)
  }

  relayUp (ip, port, nattype) {
    return Promise((resolve, reject) => {
        if (this.fingerprint === null) {
          this.register(ip, port).then(() => {this.relayUp(ip, port).then(resolve, reject)})
        }
        else {
          var proto = {
            'cmd': 'updaterelay',
            'ip': ip,
            'port': port,
            'fingerprint':this.fingerprint,
            'bandwidthlimit': KVStore.getWithDefault('bandwidth-limit', -1),
            'natType': nattype,
          }
          this.sendJSON(proto)


        }

      }
    )

  }

  register (ip, port,nattype) {
    return Promise((resolve,reject) => {
      var proto = {
        'cmd': 'register',
        'ip': ip,
        'port': port,
        'bandwidthlimit': KVStore.getWithDefault('bandwidth-limit', -1),
        'natType': nattype,
      }
      var sproto = JSON.stringify(proto)
      this.on('registered',(data)=>{
        KVStore.set('fingerprint', data.fingerprint)
        this.fingerprint=data.fingerprint;
        resolve();
      })

      this.sendJSON(proto)
      }

    )

  }

}
var ServerConnection = new WSServerConnection()
export default ServerConnection