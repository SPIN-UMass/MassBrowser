import { EventEmitter } from 'events'

import { createModel } from './orm'

class KeyValSchema {
  constructor () {
    this.value = null
  }
}

class _KVStore extends EventEmitter {
  constructor () {
    super()
    this.model = createModel('KeyVal', KeyValSchema, { collection: 'keyval' })
  }

  set (key, value) {
    return this.model.update({_id: key}, {_id: key, value: value}, {upsert: true})
    .then(() => setImmediate(() => this.emit(key, value)))
    .then(() => value)
  }

  get (key, deflt) {
    if (deflt == undefined) {
      deflt = null
    }

    return this.model.findOne({_id: key})
      .then(doc => { return doc ? doc.value : deflt })
  }

  /**
   * @deprecated
   */
  getWithDefault (key, def) {
    return this.model.findOne({_id: key})
      .then(doc => { return doc ? doc.value : def })
  }
}

const KVStore = new _KVStore()
export default KVStore
