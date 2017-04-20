import { createModel } from './base'

class CategorySchema {
  constructor() {
    this.name = null
    this.parent = null
  }
}

const Category = createModel('Category', CategorySchema)
export default Category
