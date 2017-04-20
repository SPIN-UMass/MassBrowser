import { createModel } from './base'

class RegionSchema {
  constructor() {
    this.name = null
    this.ipRanges = null
  }
}

const Region = createModel('Region', RegionSchema)
export default Region
