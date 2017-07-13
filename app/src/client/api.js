import { CommonAPI } from '~/api/common'

const API_URL = config.serverURL + '/api'
const SESSION_URL = '/sessions'
const CLIENT_URL = '/client'


class ClientAPI extends CommonAPI {
  registerClient (invitationCode) {
    return this.transport.post(
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

  clientUp () {
    return this.transport.post(
      API_URL + CLIENT_URL + '/' + this.userID, 
      {
        'categoie': 'TBD'
      }
    ).then(r => r.data)
  }

  requestSession () {
    return this.transport.post(
      API_URL + CLIENT_URL + '/' + this.userID + SESSION_URL,{
        'cdn_session':true
      }
    )
    .then(r => {
      if (r.status == 201) {
        return r.data
      }

      // Sesion not found
      return null
    })
  }
}

const API = new ClientAPI()
export default API