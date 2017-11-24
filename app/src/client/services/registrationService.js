import API from '@/api'
import KVStore from '@utils/kvstore'
import { debug, info } from '@utils/log'
import { store } from '@utils/store'

class RegistrationService {
  async registerClient(invitationCode) {
    let _client = await API.registerClient(invitationCode)
    let client = {id: _client.id, password: _client.password}
    await store.commit('registerClient', client)
    return client
  }

  isRegistered() {
    let client = store.state.client
    return !!client && !!client.id
  }
}

export const registrationService = new RegistrationService()
export default registrationService
