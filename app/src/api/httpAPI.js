import Promise from 'bluebird'
import http from '~/utils/http'
import { PermissionDeniedError, InvalidInvitationCodeError } from '~/utils/errors'

const API_URL = 'https://yaler.co/api'
const SESSION_URL = '/sessions'
const CLIENT_URL = '/client'


class API {
  constructor () {
    this.authToken = null
    this.clientID = null
    this.sessionID = null
  }

  getSessionID () {
    return this.sessionID
  }

  getLastModificationTime (entity) {
    return http.get(API_URL + '/meta/last_modification_date')
      .then(response => response.data)
      .then(text => new Date(text))
  }

  syncDatabase (entity, modifiedSince, limit = 10, offset = 0) {
    return http.get(API_URL + `/${entity}?limit=${limit}&offset=${offset}&modified_since=${modifiedSince.toISOString()}`)
      .then(response => response.data)
  }

  authenticate (username, password) {
    return http.post(
      API_URL + '/auth',
      {
        'username': username,
        'password': password
      }  
    )
    .then(response => response.data)
    .then(body => {
      this.clientID = username
      this.sessionID = body.session_key
      this.authToken = body.token
      http.setAuthToken(body.token)
    })
  }

  clientUp () {
    return http.post(
      API_URL + CLIENT_URL + '/' + this.clientID, 
      {
        'categoie': 'TBD'
      }
    ).then(r => r.data)
  }

  requestSession () {
    return http.post(
      API_URL + CLIENT_URL + '/' + this.clientID + SESSION_URL,
    )
    .then(r => {
      if (r.status == 201) {
        return r.data
      }

      // Sesion not found
      return null
    })
  }

  registerClient (invitationCode) {
    return http.post(
      API_URL + '/clients', 
      {
        ip:undefined,
        'invitation_code':invitationCode
      }
    )
    .then(r => r.data)
    .catch(PermissionDeniedError, err => {
      throw new InvalidInvitationCodeError('Invalid Invitation Code')
    })
  }

  registerRelay () {
    return http.post(
      API_URL + '/relays'
    ).then(r => r.data)
  }

  getSessions () {
    return http.get(
      API_URL + CLIENT_URL + '/' + this.clientID + '/sessions?limit=50&status=1'
    ).then(r => r.data.results)
    // .then(r => {
    //   console.log(r)
    //   return r
    // })
  }

  updateSessionStatus(sessionID, status) {
    return http.put(
      API_URL + CLIENT_URL + '/' + this.clientID + '/session/' + sessionID + '/status',
      {
        status: status
      }
    ).then(r => r.data.results)
  }
}



const api = new API()
export default api
