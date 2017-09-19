import { createModel, RelationField } from '@utils/orm'
import { remoteModel } from '@utils/remote'

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

export const Website = remoteModel(
  'website',
  () => createModel('Website', WebsiteSchema, { database: 'client' })
)
export default Website
