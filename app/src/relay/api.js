import { CommonAPI } from '~/api/common'
import config from '~/utils/config'
import KVStore from '~/utils/kvstore'

import { error, debug } from '~/utils/log'

const SESSION_PATH = '/session/'
const RELAY_PATH = '/relays/'
const CLIENT_PATH = '/client/'

class RelayAPI extends CommonAPI {
  registerRelay () {
    return this.transport.post('/relays').then(r => r.data)
  }

  acceptSession(client, sessionid) {
    return this.transport.put(SESSION_PATH + sessionid + '/status', { status: 'accepted' })
  }

  clientSessionConnected(client,sessionid) {
    return this.transport.put(SESSION_PATH + sessionid + '/status', { status: 'used' })
  }

  clientSessionDisconnected(client,sessionid) {
    debug('closing session')
    // TODO
    return new Promise((resolve,reject) => {
      resolve()
    })
  }

  relayDown() {
    return this.transport.post(RELAY_PATH + this.userID, { status: 'down' })
  }

  relayUp (ip, port) {
    var data = {
      'ip': ip,
      'status': 'up',
      'port': port,
      'fingerprint': this.fingerprint,
      'bandwidthlimit': KVStore.getWithDefault('bandwidth-limit', -1),
    }
    return this.transport.post(RELAY_PATH + this.userID, data)
  }

  relayDomainFrontUp (domain, domain_port) {
    var data = {
      'domainfrontable':true,
      'domainfront_port':domain_port,
      'domain_name':domain
    }
    return this.transport.post(RELAY_PATH + this.userID, data)
  }

  keepAlive () {
    var data = {
      'fingerprint': this.fingerprint,
    }
    return this.transport.post(RELAY_PATH + this.userID, data)
  }
}

const API = new RelayAPI()
export default API