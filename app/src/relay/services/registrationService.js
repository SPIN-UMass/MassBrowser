import API from '@/api'
import KVStore from '@utils/kvstore'
import { debug, info } from '@utils/log'
import { store } from '@utils/store'
import { Category } from '@/models'
import { syncService } from '@/services'

class RegistrationService {
  async registerRelay() {
    let categories = await Category.find({enabled: true})
    let categoryIDs = categories.map(c => c.id)

    let relayInfo = await API.registerRelay(categoryIDs)
    let relay = { id: relayInfo.id, password: relayInfo.password }
    await store.commit('registerRelay', relay)
  }

  async isRegistered() {
    const relay = await this.getRegisteredUser()
    return !!relay
  }

  async getRegisteredUser() {
    await store.ready
    const relay = store.state.relay

    if (!relay || !relay.id) {
      return null;
    }

    return relay;
  }
  constructor (){
    console.log("Registration Service Loaded!")

  }
}

export const registrationService = new RegistrationService()
export default registrationService
