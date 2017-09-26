import { CommonAPI } from '@common/api'
import config from '@utils/config'
import KVStore from '@utils/kvstore'

import { error, debug } from '@utils/log'

const SESSION_PATH = '/session/'
const RELAY_PATH = '/relays/'
const CLIENT_PATH = '/client/'

class RelayAPI extends CommonAPI {
  async registerRelay (categories) {
    let response = await this.transport.post('/relays', {
      categories: categories
    })
    return response.data
  }

  acceptSession (client, sessionid) {
    return this.transport.put(SESSION_PATH + sessionid + '/status', {status: 'relay_accepted'})
  }

  clientSessionConnected (client, sessionid) {
    return this.transport.put(SESSION_PATH + sessionid + '/status',  {status: 'used'})
  }

  clientSessionDisconnected (client, sessionid) {
    debug('closing session')
    // TODO
    return new Promise((resolve, reject) => {
      resolve()
    })
  }

  relayDown () {
    return this.transport.post(RELAY_PATH + this.userID, {status: 'down'})
  }

  relayUp (ip, port) {
    var data = {
      'ip': ip,
      'status': 'up',
      'port': port,
      'fingerprint': this.fingerprint
    }
    return this.transport.post(RELAY_PATH + this.userID, data)
  }

  relayDomainFrontUp (domain, domain_port) {
    var data = {
      'domainfrontable': true,
      'domainfront_port': domain_port,
      'domain_name': domain
    }
    return this.transport.post(RELAY_PATH + this.userID, data)
  }

  keepAlive (isUP) {
    var data = {
      'fingerprint': this.fingerprint,
      'status': isUP ? 'up' : 'down'
    }

    return this.transport.post(RELAY_PATH + this.userID, data)
  }

  getAllowedCategories () {
    var data = {}
    return this.transport.get('/relay/categories', data).then(r => r.data.allowed_categories)
  }

  setAllowedCategories (categories) {
    var data = {'allowed_categories': categories}
    return this.transport.post('/relay/categories', data).then(r => r.data.allowed_categories)
  }


}

const API = new RelayAPI()
export default API