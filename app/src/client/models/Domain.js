import { createModel, RelationField } from '~/utils/orm'

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

      return Domain.find({name: maindomain})
        .then(domains => {
          for (let i = 0; i < domains.length; i++) {
            if (domains[i].subdomainRegex.test(subdomain)) {
              return domains[i]
            }
          }

          return null
        })
    }

    return Domain.find({name: domainName})
      .then(domains => {
        if (!domains.length) {
          return trySubdomain()
        }

        // Find an exact match which has no subdomains
        for (let i = 0; i < domains.length; i++) {
          if (!domains[i].subdomain) {
            return domains[i]
          }
        }

        // Find an exact match whose subdomain matches an empty string
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

const Domain = createModel('Domain', DomainSchema, { collection: 'client-domain' })
export default Domain
