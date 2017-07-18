import { EventEmitter } from 'events'
import { Domain } from '~/relay/models'
import * as errors from '~/utils/errors'
import { error, debug } from '~/utils/log'

class _PolicyManager extends EventEmitter {
  constructor () {
    super()
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
            return reject(new errors.InvalidHostError('Domain is not in our list'))
          }

          domain.getWebsite()
            .then(website => {
              if (website === null || website === undefined) {
                reject(new errors.InvalidHostError('Website not found'))
              }
              website.getCategory()
                .then(category => {

                  if (category === null || !category.enabled) {
                    debug(category)
                    return reject(new errors.InvalidHostError('Category is not allowed'))
                  } else {
                    return resolve()
                  }
                })
            })
        })
    })
  }

}

var PolicyManager = new _PolicyManager()
export default PolicyManager
