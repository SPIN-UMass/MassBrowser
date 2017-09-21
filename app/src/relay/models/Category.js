import { createModel, RelationField } from '@utils/orm'
import { remoteModel } from '@utils/remote'

class CategorySchema {
  constructor () {
    this.name = null
    this.parent = new RelationField('Category')
    this.enabled = true
  }
}

export const Category = remoteModel(
  'category',
  () => createModel('Category', CategorySchema, { database: 'relay' })
)
export default Category
