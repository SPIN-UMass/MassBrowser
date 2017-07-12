import { createModel, RelationField } from '~/utils/orm'

class RegionSchema {
  constructor () {
    this.name = null
    this.ipRanges = null
  }
}

const Region = createModel('Region', RegionSchema, { collection: 'client-region' })
export default Region
