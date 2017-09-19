import { createModel, RelationField } from '@utils/orm'
import { remoteModel } from '@utils/remote'

class CategorySchema {
  constructor () {
    this.name = null
    this.parent = new RelationField('Category')
  }
}

export const Category = remoteModel(
  'category',
  () => createModel('Category', CategorySchema, { database: 'client' })
)
export default Category
