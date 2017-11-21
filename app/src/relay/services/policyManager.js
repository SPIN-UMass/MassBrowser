import { Domain } from '@/models'
import * as errors from '@utils/errors'
import { error, debug } from '@utils/log'

class PolicyManager {
  /**
   * Decide how to handle a given host
   *
   * @return A promise which resolves with the policy which should be
   * applied to the host
   */
  async getDomainPolicy (host, port) {
    const ipRegex = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/

    if (ipRegex.test(host)) {
      throw new errors.InvalidHostError('IP based filtering not supported')
    }

    let domain = Domain.findDomain(host)
    if (!domain) {
      throw new errors.InvalidHostError('Domain is not in our list')
    }

    let website = domain.getWebsite()
    if (website === null || website === undefined) {
      throw new errors.InvalidHostError('Website not found')
    }

    let category = website.getCategory()
    if (category === null || !category.enabled) {
      throw new errors.InvalidHostError('Category is not allowed')
    }
  }
}

export const policyManager = new PolicyManager()
export default policyManager
