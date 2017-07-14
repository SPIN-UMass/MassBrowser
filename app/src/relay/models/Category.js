import { createModel, RelationField } from '~/utils/orm'

class CategorySchema {
  constructor () {
    this.name = null
    this.parent = new RelationField('Category')
    this.enabled = false
  }
}

const Category = createModel('Category', CategorySchema, { database: 'relay' })
export default Category
