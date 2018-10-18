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
    const findDomainRec = (subdomain, maindomain) => {
      return Domain.find({name: maindomain})
        .then(domains => {
          // if it couldn't be found in the database, try to query with
          // its subdomain. For example, if cs.umass.edu can't be found,
          // try umass.edu insteada.
          if (!domains.length) {
          // Extract subdomain
            var firstDot = maindomain.indexOf('.')
            if (firstDot == -1) {
              return null
            }
            // i.e. split cs.umass.edu into cs and umass.edu
            subdomain = maindomain.substring(0, firstDot)
            maindomain = maindomain.substring(firstDot + 1)

            return findDomainRec(subdomain, maindomain)
          }
          for (let i = 0; i < domains.length; i++) {
            // Q: Why do we need to match with subdomianRegex?

            // From the above example, we have splited cs.umass.edu
            // into cs and umass.edu and query the DB with
            // umass.edu. Assuming we have gotten a list of domain
            // objects by querying umass.edu, we need to figure out if
            // any of them contains a subdomain that matches cs.

            // TODO: "accurate matching first" feature need to be
            // implemented. That is to say there are two rules in the DB:
            // {domain: umass.edu subdomain: *}
            // {domain: umass.edu subdomain: cs}
            // we shoud prefer matching cs rule first in this case.
            if (domains[i].subdomainRegex.test(subdomain)) {
              return domains[i]
            }

            // // When a list of objects are returned, find an exact match
            // // which has no subdomains
            // for (let i = 0; i < domains.length; i++) {
            //   if (!domains[i].subdomain) {
            //     return domains[i]
            //   }
            // }

            // // If we couldn't find an object without a subdomain field,
            // // try finding an exact match whose subdomain matches an empty
            // // string instead
            // for (let i = 0; i < domains.length; i++) {
            //   if (domains[i].subdomainRegex.test('')) {
            //     return domains[i]
            //   }
            // }
          }
          return null
        })                      // end .then
    }                  // end const findDomainRec()
    return findDomainRec('',domainName)
  }      // end static findDomain()

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
