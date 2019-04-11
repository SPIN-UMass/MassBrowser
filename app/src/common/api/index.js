import { HttpTransport } from '@utils/transport'
import config from '@utils/config'
import { error } from '@utils/log'
import { debug } from 'util';

const SESSION_URL = '/sessions'
const CLIENT_URL = '/client'

export class CommonAPI {
  constructor () {
    this.transport = new HttpTransport(config.serverURL + '/api')

    this.authToken = null
    this.userID = null
  }

  setTransport(transport) {
    this.transport = transport
  }

  authenticate (username, password) {
    return this.transport.post(
      '/auth',
      {
        'username': username,
        'password': password
      }  
    )
    .then(response => response.data)
    .then(body => {
      this.userID = username
      return body
    })
  }
  
  getLastModificationTime (entity) {
    return this.transport.get('/meta/last_modification_date')
      .then(response => response.data)
      .then(text => new Date(text))
  }

  syncDatabase (entity, modifiedSince, limit = 10, offset = 0) {
    return this.transport.get(
      `/${entity}?limit=${limit}&offset=${offset}&modified_since=${modifiedSince.toISOString()}`
    )
    .then(response => response.data)
  }

  getSessions () {
    return this.transport.get(
      CLIENT_URL + '/' + this.userID + '/sessions?limit=50'//&status=1'
    ).then(r => r.data.results)
  }

  // C2C sessions, status=1 does not work, not sure what status=1's purpose is.
  getC2CSessions () {
    debug("Sending getC2CSessions()")
    return this.transport.get(
      CLIENT_URL + '/' + this.userID + '/c2csessions?limit=30'
    ).then(r => r.data.results)
  }

  getReqC2CSessions() {
    debug("Sending getReqC2CSessions()")
    return this.transport.get(
        CLIENT_URL + '/' + this.userID + '/reqc2csessions?limit=30'
    ).then(r => r.data.results)
  }

  updateSessionStatus(sessionID, status) {
    return this.transport.put(
      CLIENT_URL + '/' + this.userID + '/session/' + sessionID + '/status',
      {
        status: status
      }
    ).then(r => r.data.results)
  }

  updateC2CSessionStatus(sessionID, status) {
    // edit print to work?
    debug("Sending updateC2CSessionStatus() with " + sessionID + ", " + status)
    return this.transport.put(
      CLIENT_URL + '/' + this.userID + '/c2csession/' + sessionID + '/status',
      {
        status: status
      }
    ).then(r => r.data.results)
  }

  // maybe generalize for client and relay, relay has currently its own version in its API
  // up to now, this CLIENT_URL and RELAY_PATH is not generalized. 
  
  // Only for clientRelay now!
  keepAlive (isUP) {
    var data = {
      'fingerprint': this.fingerprint,
      'status': isUP ? 'up' : 'down'
    }

    return this.transport.post(CLIENT_URL + '/' + this.userID, data)
  }

  async getPrivacyPolicyVersion () {
    const privacyPolicyVersionUrl = config.isRelay
      ? 'https://massbrowser.cs.umass.edu/privacy/relay-privacy-version'
      : 'https://massbrowser.cs.umass.edu/privacy/client-privacy-version'

    const response = await this.transport.get(privacyPolicyVersionUrl)
    try {
      return await response.data
    } catch (e) {
      error(e)
      return 0
    }
  }

  // could be used by both client and relay later. Until now, the common folder seems to be rather rarely used...
  // not sure how backend identifies client like this?
  getAllowedCategories () {
    var data = {}
    return this.transport.get(
        CLIENT_URL + '/categories', data).then(r => r.data.allowed_categories)
  }

  setAllowedCategories (categories) {
    var data = {'allowed_categories': categories}
    return this.transport.post(
        CLIENT_URL + '/categories', data).then(r => r.data.allowed_categories)
  }

  allowCategory(categoryID) {
    return this.transport.put(
        CLIENT_URL + '/category/' + categoryID)
  }

  disallowCategory(categoryID) {
    return this.transport.delete(
        CLIENT_URL + '/category/' + categoryID)
  }
}

const API = new CommonAPI()
export default API

