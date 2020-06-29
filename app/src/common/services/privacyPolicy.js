import config from '@utils/config'
import { store } from '@utils/store'
import { info, error, warn, readLogs } from '@utils/log'
import api from '@/api'

class PrivacyPolicyService {
  constructor () {
    this.privacyPolicyVersion = null
  }

  /**
   *
   * @returns {Promise<number>} 0 if notification is not required, 1 if notification is required because it is the first
   * time running, 2 if notification is required because the privacy policy has been updated
   */
  async isPrivacyPolicyNotificationRequired () {
    await store.ready

    const privacyPolicyVersion = await api.getPrivacyPolicyVersion()
    const latestAcceptedVersion = store.state.latestAcceptedPrivacyPolicyVersion
    this.privacyPolicyVersion = privacyPolicyVersion

    if (latestAcceptedVersion == null) {
      return 1
    }
    if (privacyPolicyVersion > latestAcceptedVersion) {
      return 2
    }
    return 0
  }

  async privacyPolicyAccepted () {
    if (this.privacyPolicyVersion == null) {
      this.privacyPolicyVersion = await api.getPrivacyPolicyVersion()
    }
    store.commit('setLatestAcceptedPrivacyPolicyVersion', this.privacyPolicyVersion)
  }
}

export const privacyPolicyService = new PrivacyPolicyService()
export default privacyPolicyService
