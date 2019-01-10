import { CommonAPI } from '@common/api'
import { PermissionDeniedError, InvalidInvitationCodeError } from '@utils/errors'
import config from '@utils/config'
import { error, debug } from '@utils/log'
// @ above means the root of the project (MassBrowser/app/scr)
// It is implemented by a babel plugin:
// https://github.com/entwicklerstube/babel-plugin-root-import

const SESSION_URL = '/sessions'
const CLIENT_URL = '/client'
const globalDNSCache = {}

class ClientAPI extends CommonAPI {
  registerClient (invitationCode) {
    return this.transport.post(
      '/clients',
      {
        ip: undefined,
        'invitation_code': invitationCode
      }
    )
    // r, as a parameter of an arrow function, will be the value of
    // what returned by this.transport.post()
    // Note that the final value returned by the registerClient
    // function is r.data
    .then(r => r.data)
    .catch(err => {
      if (err instanceof PermissionDeniedError) {
        throw new InvalidInvitationCodeError('Invalid Invitation Code')
      }
      throw err
    })
  }

  clientUp () {
    return this.transport.post(
      CLIENT_URL + '/' + this.userID,
      {
        'categoie': 'TBD'
      }
    ).then(r => r.data)
  }

  requestSession (categories) {
    return this.transport.post(
      CLIENT_URL + '/' + this.userID + SESSION_URL,
      {
        'categories': categories
      }
    ).then(r => {
      if (r.status == 201) {
        return r.data
      }

      // Sesion not found
      return null
    },(err)=>{			// how to understand this ","?
      return null
    })
  }

  // requestAllRelays will return all the relays that backend knows
  requestAllRelays() {
    return this.transport.post(
      CLIENT_URL + '/' + 'everything',
      ''
    ).then(r => {
      if (r.status == 201) {
	return r.data
      }
      else{
	console.log('Failed to get all realy information. HTTP status: ', r.status)
	return null
      }
    }, (error) =>{
      console('Failed to get all realy information. Error: ', error)
      return null
    })
  }

  // requestSession will talk to the backend to establish a session
  // with the given relay
  requestAllRelays(relayInfo) {
    return this.transport.post(
      CLIENT_URL + '/' + 'everything',
      ''
    ).then(r => {
      if (r.status == 201) {
	return r.data
      }
      else{
	console.log('Failed to get all realy information. HTTP status: ', r.status)
	return null
      }
    }, (error) =>{
      console('Failed to get all realy information. Error: ', error)
      return null
    })
  }

  updateClientAddress (remoteIP, remotePort) {
    debug(`Sending address info to server: ${remoteIP} ${remotePort}`)
    return this.transport.post(
      CLIENT_URL + '/' + this.userID,
      {
        'ip': remoteIP,
        'port': remotePort
      }
    ).then(r => r.data)
  }

  requestNewStunServer () {
    var data = {}
    return new Promise((resolve, reject) => {
      resolve({
        'ip': config.serverURL.replace('https://', ''),
        'port': 8823
      })
    })
    // TODO:
    //return this.transport.get('/client/stun', data).then(r => r.data.allowed_categories)
  }

  async sendFeedback(content, rating, logs) {
      // Without the await, the value returned is a promise. With the
      // await, it will wait untill getting a value from
      // tranpsort.post function
      return await this.transport.post('/client/feedback', {
	content,
	rating,
	logs
      })
  }

  async requestWebsiteSupport(hostname) {
    return await this.transport.post('/website/request', {
      hostname
    })
  }

  async resolveURL(URL) {
    let resolved_ip = globalDNSCache[URL]
    // return the IP corresponding to the URL if it is cached already
    if (resolved_ip) {
      return resolved_ip
    }
    // otherwise we do a DNS-over-HTTPS
    try{
      let response = await this.transport.post(CLIENT_URL + '/resolve',
      {
        'url': URL
      })
      if (response.status == 200) {
        // if success, cached and return the URL-IP pair
        globalDNSCache[URL]= response.data.IP
        return response.data.IP
      }
      return null
    }
    catch (err) {
      debug(`Cannot connect to resolving server`, err)
      return null
    }
  }

}

const API = new ClientAPI()
export default API
