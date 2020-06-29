import { Domain, Category } from '@/models'
import * as errors from '@utils/errors'
import { error, debug } from '@utils/log'
import { torService, telegramService } from '@common/services'

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
      /* IP hosts are only allowed for Tor destinations */
      const torCategory = (await Category.find({name: 'Tor'}))[0]
      const telegramCategory = (await Category.find({name: 'Messaging'}))[0]
      if (torCategory.enabled && torService.isTorIP(host)) {
        debug('Tor Relay')
        return
      }
      else if ( telegramCategory.enabled && telegramService.isTelegramIP(host))
      {
        debug('Telegram IP')
        return 
      }
      else{
        throw new errors.InvalidHostError('IP based filtering only supported for Tor and Telegram')
      }
      
    }

    let domain = await Domain.findDomain(host)
    if (!domain) {
      throw new errors.InvalidHostError('Domain is not in our list')
    }

    let website = await domain.getWebsite()
    if (website === null || website === undefined) {
      throw new errors.InvalidHostError('Website not found')
    }

    let category = await website.getCategory()
    if (category === null || !category.enabled) {
      throw new errors.InvalidHostError('Category is not allowed')
    }
  }
}

export const policyManager = new PolicyManager()
export default policyManager
