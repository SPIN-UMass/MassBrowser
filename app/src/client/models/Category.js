import { createModel, RelationField } from '@utils/orm'

class CategorySchema {
  constructor () {
    this.name = null
    this.parent = new RelationField('Category')
  }
}

const Category = createModel('Category', CategorySchema, { database: 'client' })
export default Category
