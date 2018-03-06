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

  async isRegistered() {
    const client = await this.getRegisteredUser()
    return !!client
  }

  async getRegisteredUser() {
    await store.ready
    
    const client = store.state.client

    if (!client || !client.id) {
      return null;
    }

    return client;
  }
}

export const registrationService = new RegistrationService()
export default registrationService
