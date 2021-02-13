import { CommonAPI } from '@common/api'
import { PermissionDeniedError, InvalidInvitationCodeError } from '@utils/errors'
import config from '@utils/config'
import { debug } from '@utils/log'

const SESSIONS_PATH = '/sessions'

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
      .then(r => r.data)
      .catch(err => {
        if (err instanceof PermissionDeniedError) {
          throw new InvalidInvitationCodeError('Invalid Invitation Code')
        }
        throw err
      })
  }

  async submitMeasurementReport(report) {
    return this.transport.post(CLIENT_URL + '/' + this.userID + '/measurement',report).then(r=>r.data)
  }

  async clientUp () {
    debug('HEEEEEEY sending version',this.userID)
    return  this.transport.post(
      CLIENT_URL + '/' + this.userID, {
        'version': config.version
      }).then(r => r.data)
  }




  async getMeasurementTask() {
    return await this.transport.get(
      CLIENT_URL + '/' + this.userID + '/measurement'
    ).then(r => r.data)
  }

  requestSession (categories) {
    return this.transport.post(
      CLIENT_URL + '/' + this.userID + SESSIONS_PATH, {
        'testing': false,
        'categories': categories
      }
    )
      .then(r => {
        if (r.status == 201) {
          return r.data
        }
        return null
      }, (err) => {
        return null
      })
  }

  updateClientAddress (remoteAddress, remoteTCPPort, remoteUDPPort, remoteSecondUDPPort) {
    debug(`Sending address info to server: ${remoteAddress} ${remoteTCPPort} ${remoteUDPPort} ${remoteSecondUDPPort}`)
    return this.transport.post(
      CLIENT_URL + '/' + this.userID, {
        'ip': remoteAddress,
        'port': remoteTCPPort,
        'udp_port': remoteUDPPort,
        'udp_alt_port': remoteSecondUDPPort,
        'version': config.version
      }).then(r => r.data)
  }

  requestNewUDPStunServer () {
    return new Promise((resolve, reject) => {
      resolve({
        'ip': 'voyager.cs.umass.edu',
        'port': 3478
      })
    })
  }

  requestNewStunServer () {
    return new Promise((resolve, reject) => {
      resolve({
        'ip': config.echoServer.host,
        'port': config.echoServer.port
      })
    })
    // var data = {}
    // TODO: return this.transport.get('/client/stun', data).then(r => r.data.allowed_categories)
  }

  async sendFeedback (content, rating, logs) {
    return await this.transport.post('/client/feedback', {
      content,
      rating,
      logs
    })
  }

  async requestWebsiteSupport (hostname) {
    return await this.transport.post('/website/request', {
      hostname
    })
  }

  async resolveURL (URL) {
    let resolvedAddress = globalDNSCache[URL]
    if (resolvedAddress) {
      return resolvedAddress
    }
    try {
      let response = await this.transport.post(CLIENT_URL + '/resolve',
        {
          'url': URL
        })
      if (response.status == 200) {
        globalDNSCache[URL] = response.data.IP
        return response.data.IP
      }
      return null
    } catch (err) {
      debug(`Cannot connect to server`, err)
      return null
    }
  }

}

const API = new ClientAPI()
export default API
