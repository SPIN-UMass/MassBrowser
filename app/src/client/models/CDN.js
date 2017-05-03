import { createModel } from '~/models'

class CDNSchema {
  constructor() {
    this.name = null
    this.ipRanges = null
    this.cachebrowsable = null
    this.requires_sni = null
  }
}

const CDN = createModel('CDN', CDNSchema)
export default CDN
