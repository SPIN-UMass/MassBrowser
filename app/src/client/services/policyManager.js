import { EventEmitter } from 'events'
import { Domain } from '@/models'
import { torService, telegramService } from '@common/services'
import * as errors from '@utils/errors'

class PolicyManager extends EventEmitter {
  constructor () {
    super()

    this.POLICY_VANILLA_PROXY = 'vanilla_proxy'
    this.POLICY_YALER_PROXY = 'yaler_proxy'
    this.POLICY_CACHEBROWSE = 'cachebrowse'
  }

  /**
   * Decide how to handle a given host
   *
   * @return A promise which resolves with the policy which should be
   * applied to the host
   */

  getDomainPolicy (host, port) {
    return new Promise((resolve, reject) => {
      
      const net = require('net')
      if (net.isIP(host)) {
        return reject(new errors.InvalidHostError('IP based filtering not supported'))
      }
      // return resolve(this.POLICY_YALER_PROXY)
      Domain.findDomain(host)

        .then(domain => {
          
          
          if (!domain) {
            
            return resolve(this.POLICY_VANILLA_PROXY)
          }

          domain.getWebsite()
            .then(website => {
              if (website && !website.enabled) {
                return resolve(this.POLICY_VANILLA_PROXY)
              }

              // TODO Check if it is blocked in region. For now, we assume

              var blockedInRegion = true

              if (!blockedInRegion) {
                return resolve(this.POLICY_VANILLA_PROXY)
              }

              // If the website is blocked but does not support ssl, it
              // wouldn't be able to take the advantage of
              // CDNBrowsing. Therefore, we need the help from Mass
              // Buddies.

              if (!domain.ssl) {
                return resolve(this.POLICY_YALER_PROXY)
              }

              // If it does support ssl, check if it supports CDNBrowsing.

              domain.getCDN()
                .then(cdn => {
                  if (cdn == null || !cdn.cachebrowsable) {
                    return resolve(this.POLICY_YALER_PROXY)
                  } else {
                    return resolve(this.POLICY_CACHEBROWSE)
                  }
                })
            })
        })
    })
  }

  async getDomainPolicyRelay (host, port) {
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
    // ignore for now 
    // if (category === null || !category.enabled) {
    //   throw new errors.InvalidHostError('Category is not allowed')
    // }
  }
}

export const policyManager = new PolicyManager()
export default policyManager
