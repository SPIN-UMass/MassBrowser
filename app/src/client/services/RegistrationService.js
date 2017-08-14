import API from '@/api'
import KVStore from '@utils/kvstore'
import { debug, info } from '@utils/log'
import Context from '@/context'

class _RegistrationService {
  constructor () {
  }

  registerClient(invitationCode) {
    return API.registerClient(invitationCode)
    .then(_client => {
      let client = {id: _client.id, password: _client.password}
      return Context.registerClient(client)
    })
  }
}

const RegistrationService = new _RegistrationService()
export default RegistrationService
