import { createModel, RelationField } from '~/utils/orm'

class CDNSchema {
  constructor () {
    this.name = null
    this.ipRanges = null
    this.cachebrowsable = null
    this.requires_sni = null
  }
}

const CDN = createModel('CDN', CDNSchema, { database: 'relay' })
export default CDN
