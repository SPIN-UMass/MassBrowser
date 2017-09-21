import { createModel, RelationField } from '@utils/orm'
import { remoteModel } from '@utils/remote'

class CDNSchema {
  constructor () {
    this.name = null
    this.ipRanges = null
    this.cachebrowsable = null
    this.requires_sni = null
  }
}

export const CDN = remoteModel(
  'cdn',
  () => createModel('CDN', CDNSchema, { database: 'relay' })
)
export default CDN
