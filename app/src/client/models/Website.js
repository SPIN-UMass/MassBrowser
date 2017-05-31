import { createModel, RelationField } from '~/utils/orm'

class WebsiteSchema {
  constructor() {
    this.name = null
    this.category = new RelationField('Category')
    this.blocked = null
    this.enabled = false
  }
}

const Website = createModel('Website', WebsiteSchema, {collection: 'websites'})
export default Website
