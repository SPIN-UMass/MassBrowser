import { createModel } from './orm'

class KeyValSchema {
  constructor () {
    this.value = null
  }
}

class _KVStore {
  constructor () {
    this.model = createModel('KeyVal', KeyValSchema, {collection: 'keyval'})
  }

  set (key, value) {
    return this.model.update({_id: key}, {_id: key, value: value}, {upsert: true})
  }

  get (key) {
    return this.model.findOne({_id: key})
      .then(doc => { return doc ? doc.value : null })
  }
  getWithDefault (key, def) {
    return this.model.findOne({_id: key})
      .then(doc => { return doc ? doc.value : def })
  }
}

const KVStore = new _KVStore()
export default KVStore
