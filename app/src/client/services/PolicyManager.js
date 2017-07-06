import { EventEmitter } from 'events'
import { Domain } from '~/client/models'
import * as errors from '~/utils/errors'

class _PolicyManager extends EventEmitter {
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
    const ipRegex = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/

    return new Promise((resolve, reject) => {
      if (ipRegex.test(host)) {
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
          if (!website.enabled) {
            return resolve(this.POLICY_VANILLA_PROXY)
          }

          // TODO Check if it is blocked in region
          var blockedInRegion = true

          if (!blockedInRegion) {
            return resolve(this.POLICY_VANILLA_PROXY)
          }

          if (!domain.ssl) {
            return resolve(this.POLICY_YALER_PROXY)
          }
          
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

var PolicyManager = new _PolicyManager()
export default PolicyManager
