import Datastore from 'nedb'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.env.HOME, '.yaler')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR)
}

function _createModel(name, schemaModel, meta, datastore) {
  var schema = null

  const Model = class extends schemaModel {
    constructor() {
      super()

      if (!schema) {
        schema = ['_id'].concat(Object.keys(this).filter(k => !k.startsWith('_')))
      }
      
      this._schema = schema
      this.model = Model
      this._new_instance = true
    }

    static get name() {
      return name
    }
    
    static _promisize (func, args) {
      return new Promise((resolve, reject) => {
        var eArgs = Array.from(args)
        eArgs.push((err, result) => {
          if (err) {
            return reject(err)
          }
          return resolve(result)
        })
        func.apply(datastore, eArgs)
      })
    }

    static find (q) {
      console.log("[DATABASE] <find> " + this.name)
      if (q === undefined) {
        q = {}
      }
      return this._promisize(datastore.find, [q])
        .then(docs => docs.map(doc => this.docToModel(doc)))
    }

    static findOne (q) {
      console.log("[DATABASE] <findOne> " + this.name)
      if (q === undefined) {
        q = {}
      }
      return this._promisize(datastore.findOne, [q])
        .then(doc => doc ? this.docToModel(doc) : null)
    }

    static insert () {
      console.log("[DATABASE] <insert> " + this.name)
      return this._promisize(datastore.insert, arguments)
    }

    static update () {
      console.log("[DATABASE] <update> " + this.name)
      return this._promisize(datastore.update, arguments)
    }

    static docToModel(doc) {
      const obj = new Model()
      obj._new_instance = false
      Object.assign(obj, doc)
      return obj
    }

    toObject() {
      return this._schema.reduce((o, k) => { 
        o[k] = this[k]
        return o
      }, {})
    }

    save() {
      const insert = () => {
        return this.constructor.insert(this.toObject())
          .then(doc => {
            this._id = doc._id
            this._new_instance = false
            return doc
          })
      }

      if (!this._id) {
        return insert()  
      }

      return this.constructor.findOne({_id: this._id})
        .then(doc => {
          if (!doc) {
            return insert()
          }

          var changed = this._schema.reduce((r, k) =>  r || (doc[k] !== this[k]), false)
          if (changed) {
            return this.constructor.update({_id: this._id}, this.toObject())
          }
          
          return doc
        })
    }
  }

  return Model
}

export function createModel(name, schemaModel, meta) {
  meta = meta || {}
  const collectionName = meta.collection || name.toLowerCase()

  const datastore = new Datastore({
    filename: path.join(DATA_DIR, collectionName + '.db'),
    autoload: true
  })

  return _createModel(name, schemaModel, meta, datastore)
}