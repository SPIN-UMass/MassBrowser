import { createModel } from '~/models'

class RegionSchema {
  constructor() {
    this.name = null
    this.ipRanges = null
  }
}

const Region = createModel('Region', RegionSchema)
export default Region
