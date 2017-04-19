import { createModel } from './base'

class WebsiteSchema {
  constructor() {
    this.name = null
    this.category = null
  }
}

const Website = createModel('Website', WebsiteSchema, {collection: 'websites'})
export default Website
