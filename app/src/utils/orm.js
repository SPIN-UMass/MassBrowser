import Datastore from 'nedb'
import fs from 'fs'
import path from 'path'

import { remote } from 'electron'
import { getDataDir } from '~/utils'


const DATA_DIR = getDataDir()

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR)
}

const createdModels = {}

function _createModel(name, schemaModel, meta, datastore) {
  var schema = null


  const Model = class extends schemaModel {
    constructor() {
      super()

      // Schema object has to be created in constructor rather than being a prototype variable
      // since the SchemaModel fields are set in the contructor
      // We cache the schema object here to avoid creating it for each instance
      if (!schema) {
        schema = setSchema(this)
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
      // console.log("[DATABASE] <find> " + this.name)
      if (q === undefined) {
        q = {}
      }
      return this._promisize(datastore.find, [q])
        .then(docs => docs.map(doc => this.docToModel(doc)))
    }

    static findOne (q) {
      // console.log("[DATABASE] <findOne> " + this.name)
      if (q === undefined) {
        q = {}
      }
      return this._promisize(datastore.findOne, [q])
        .then(doc => doc ? this.docToModel(doc) : null)
    }

    static insert () {
      // console.log("[DATABASE] <insert> " + this.name)
      return this._promisize(datastore.insert, arguments)
    }

    static update () {
      // console.log("[DATABASE] <update> " + this.name)
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
            this.id = doc.id
            this._new_instance = false
            return this
          })
      }

      if (!this.id) {
        return insert()  
      }

      return this.constructor.findOne({id: this.id})
        .then(doc => {
          if (!doc) {
            return insert()
          }

          var changed = this._schema.reduce((r, k) =>  r || (doc[k] !== this[k]), false)
          if (changed) {
            return this.constructor.update({_id: this._id}, this.toObject())
          }
          
          return this
        })
    }
  }

  function setSchema(modelInstance) {
    schema = ['id'].concat(Object.keys(modelInstance).filter(k => !k.startsWith('_')))

    schema.forEach(k => {
      if (modelInstance[k] instanceof RelationField) {
        var relationField = modelInstance[k]
        var relatedModel = relationField.relatedModel

        if (typeof relatedModel === 'string') {
          relatedModel = createdModels[relatedModel]
          
          if (relatedModel === undefined) {
            throw 'No model defined with name ' + relationField.relatedModel
          }
        }

        Model.prototype['get' + k[0].toUpperCase() + k.substr(1)] = function() {
          return relatedModel.findOne({id: this[k]})
        }
      }
    })

    return schema
  }

  return Model
}

export function createModel(name, schemaModel, meta, dataDir) {
  meta = meta || {}
  dataDir = dataDir || DATA_DIR
  
  const collectionName = meta.collection || name.toLowerCase()

  const datastore = new Datastore({
    filename: path.join(dataDir, collectionName + '.db'),
    autoload: true
  })

  var model = _createModel(name, schemaModel, meta, datastore)
  createdModels[name] = model
  return model
}

export class RelationField {
  constructor(relatedModel) {
    this.relatedModel = relatedModel
  }
}