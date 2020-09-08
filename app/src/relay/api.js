import { CommonAPI } from '@common/api'
import { debug } from '@utils/log'

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

  requestNewUDPStunServer () {
    return new Promise((resolve, reject) => {
      resolve({
        'ip': 'voyager.cs.umass.edu',
        'port': 3478
      })
    })
  }

  acceptSession (client, sessionid) {
    return this.transport.put(SESSION_PATH + sessionid + '/status', {status: 'relay_accepted'})
  }

  clientSessionConnected (client, sessionid) {
    return this.transport.put(SESSION_PATH + sessionid + '/status', {status: 'used'})
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

  relayUp (ip, TCPPort, UDPPort) {
    var data = {
      'ip': ip,
      'status': 'up',
      'port': TCPPort,
      'udp_port': UDPPort,
      'fingerprint': this.fingerprint
    }
    debug('Sending status update for relay', data)
    return this.transport.post(RELAY_PATH + this.userID, data)
  }

  relayDomainFrontUp (domain, domainPort) {
    var data = {
      'domainfrontable': true,
      'domainfront_port': domainPort,
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

  allowCategory (categoryID) {
    return this.transport.put('/relay/category/' + categoryID)
  }

  disallowCategory (categoryID) {
    return this.transport.delete('/relay/category/' + categoryID)
  }

  async sendFeedback (content, rating, logs) {
    return await this.transport.post('/relay/feedback', {
      content,
      rating,
      logs
    })
  }
}

const API = new RelayAPI()
export default API
