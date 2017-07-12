import { createModel, RelationField } from '~/utils/orm'

class CategorySchema {
  constructor () {
    this.name = null
    this.parent = new RelationField('Category')
  }
}

const Category = createModel('Category', CategorySchema, { collection: 'client-category' })
export default Category
