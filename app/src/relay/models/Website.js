import { createModel, RelationField } from '~/utils/orm'

class WebsiteSchema {
  constructor () {
    this.name = null
    this.category = new RelationField('Category')
    this.blocked = null
    this.enabled = true
    this.thirdParty = false
  }

  get transform() {
    return {
      'third_party': 'thirdParty'
    }
  }
}

const Website = createModel('Website', WebsiteSchema, {collection: 'websites'})
export default Website
