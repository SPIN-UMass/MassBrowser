import { EventEmitter } from 'events'
import { Domain } from '@/models'
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
}

export const policyManager = new PolicyManager()
export default policyManager
