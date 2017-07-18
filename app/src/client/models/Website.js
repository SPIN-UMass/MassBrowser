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
      'third_party': 'thirdParty',
      'categories': {
        name: 'category',
        value: categories => categories[0]
      }
    }
  }
}

const Website = createModel('Website', WebsiteSchema, { database: 'client' })
export default Website
