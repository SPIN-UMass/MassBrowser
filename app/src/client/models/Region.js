import { createModel, RelationField } from '@utils/orm'
import { remoteModel } from '@utils/remote'

class RegionSchema {
  constructor () {
    this.name = null
    this.ipRanges = null
  }
}

export const Region = remoteModel(
  'region',
  () => createModel('Region', RegionSchema, { database: 'client' })
)
export default Region
