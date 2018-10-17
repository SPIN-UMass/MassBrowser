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

      // i.e. split cs.umass.edu into sc. and umass.edu
      let subdomain = domainName.substring(0, firstDot)
      let maindomain = domainName.substring(firstDot + 1)

      // Q: should we do a recursive query with subdomain extracted in
      // each call until a matching domain is found or until the
      // domainname is ''? Right now, if the domainname is
      // massbrowser.cs.umass.edu, and the length of query result is
      // 0, we then call trySubdomain which will try querying
      // cs.umass.edu instead. But what if cs.umass.edu is not found,
      // but we do have a rule for umass.edu availble?
      return Domain.find({name: maindomain})
        .then(domains => {
          for (let i = 0; i < domains.length; i++) {
            // Q: Why do we need to match with subdomianRegex?

            // A: the subdomainRegex is an attributes of domain
            // object, therefore, when writing a rule in the DB, we do
            // not have to write all the possible subdomains, rather,
            // we write a regex instead. From the above example, we
            // have splited cs.umass.edu into cs. and umass.edu adn
            // query the DB with umass.edu. Assuming we have gotten a
            // list of domain objects, we need to figure out if any of
            // them contains a subdomainRegex that allow we have such
            // a subdomain along withthe maindomain. That is to say,
            // even if umass.edu object is found in database, we still
            // need to test if cs.umass.edu is allowed in the rule.
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
