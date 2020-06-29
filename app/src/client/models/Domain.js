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

  // The 'subdomain' attribute of domain object is actually part of a
  // regex rule. With the help of the getter function subdomainRegex,
  // it will form a complete regex. For example, the subdomain
  // attribute of a domain object is 'cs', then it is processed into
  // regex '^cs$'. If the subdomain attribute doesn't exist, we write
  // regex to match empty string '^$'

  // Note that we do NOT assume the existence of subdomain attribute
  // in a domain object. We do caching for better performance and
  // saving memory.
  get subdomainRegex () {
    // retrieve cache first
    if (this._regex_cache) {
      return this._regex_cache
    }
    // if this.subdomain is undefined, then it will return undefined as well
    var regex = globalRegexCache[this.subdomain]
    if (regex) {
      return regex
    }

    // create a new regex since it's not in the cache
    regex = new RegExp('^' + (this.subdomain || '') + '$')

    // save cache
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
          // domains is an array of domains objects returned by the
          // Domain.find()

          // very useful debugging info
          // console.log("Function call Domain.find(", maindomain, ") returns: ", domains)

          // if it couldn't be found in the database, try to query with
          // its subdomain. For example, if cs.umass.edu can't be found,
          // try umass.edu instead.
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
              // very useful debugging info
              // console.log("Returns the final matching domain object: ", domains[i])
              return domains[i]
            }
          }
          return null
        })                      // end .then
    }                  // end const findDomainRec()
    return findDomainRec('', domainName)
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
