import API from '@/api'
import KVStore from '@utils/kvstore'
import { debug, info } from '@utils/log'
import { store } from '@utils/store'

class RegistrationService {
  registerClient(invitationCode) {
    return API.registerClient(invitationCode)
    .then(_client => {
      let client = {id: _client.id, password: _client.password}
      return store.commit('registerClient', client)
    })
  }
}

export const registrationService = new RegistrationService()
export default registrationService
