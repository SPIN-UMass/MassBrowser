import { createModel, RelationField } from '@utils/orm'
import { remoteModel } from '@utils/remote'

const globalRegexCache = {}

class DomainSchema {
  constructor () {
    this.name = null
    this.subdomain = null
    this.blockedRegions = null
    this.website = new RelationField('Website')
    this.cdn = new RelationField('CDN')
    this.ssl = null

    this._regex_cache = null
  }

  get subdomainRegex () {
    if (this._regex_cache) {
      return this._regex_cache
    }

    let regex = globalRegexCache[this.subdomain]
    if (regex) {
      return regex
    }

    regex = new RegExp('^' + (this.subdomain || '') + '$')

    globalRegexCache[this.subdomain] = regex
    this._regex_cache = regex

    return regex
  }

  /**
   * Find Domain object matching the domain name
   *
   */
  static findDomain (domainName) {
    const trySubdomain = () => {
      // Extract subdomain
      let firstDot = domainName.indexOf('.')
      if (firstDot == -1) {
        return null
      }

      let subdomain = domainName.substring(0, firstDot)
      let maindomain = domainName.substring(firstDot + 1)

      // Note that this is a recursive query with subdomain extracted
      // in each call until a matching domain is found or until the
      // domainname is ''
      return Domain.find({name: maindomain})
        .then(domains => {
          for (let i = 0; i < domains.length; i++) {
            // Q: Why do we need to match with subdomianRegex?
            if (domains[i].subdomainRegex.test(subdomain)) {
              return domains[i]
            }
          }

          return null
        })
    }

    // lookup the requested domainname from the database

    // Domain.find will return a list of objects whose name field is
    // domainName
    return Domain.find({name: domainName})
      .then(domains => {
        // if it couldn't be found in the database, try to query with
        // its subdomain. For example, if cs.umass.edu can't be found,
        // try umass.edu instead.
        if (!domains.length) {
          return trySubdomain()
        }

        // When a list of objects are returned, find an exact match
        // which has no subdomains
        for (let i = 0; i < domains.length; i++) {
          if (!domains[i].subdomain) {
            return domains[i]
          }
        }

        // If we couldn't find an object without a subdomain field,
        // try finding an exact match whose subdomain matches an empty
        // string instead
        for (let i = 0; i < domains.length; i++) {
          if (domains[i].subdomainRegex.test('')) {
            return domains[i]
          }
        }

        // No domain was found with this name that had no subdomain
        return null
      })
  }

  toString () {
    if (this.subdomain) {
      return `${this.subdomain}.${this.name}`
    }
    return this.name
  }
}

export const Domain = remoteModel(
  'domain',
  () => createModel('Domain', DomainSchema, { database: 'client' })
)
export default Domain
