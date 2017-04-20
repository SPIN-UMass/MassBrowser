import { createModel } from './base'

class WebsiteSchema {
  constructor() {
    this.name = null
    this.category = null
    this.blocked = null
    this.enabled = false
  }
}

const Website = createModel('Website', WebsiteSchema, {collection: 'websites'})
export default Website
