import Datastore from 'nedb'
import fs from 'fs'
import path from 'path'

const DB_NAME = 'yalerdb'
const DATA_DIR = path.join(process.env.HOME, '.yaler')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR)
}

class DatastoreManager {
  constructor() {
    this.collections = {}
  }

  setItem(key, val) {
    return new Promise((resolve, reject) => {
      localStorage.setItem(key, JSON.stringify(val))
      resolve()
    })
  }

  getItem(key) {
    return new Promise((resolve, reject) => {
      resolve(JSON.parse(localStorage.getItem(key)))
    })
  }

  collection(name) {
    return new Promise((resolve, reject) => {
      if (name in this.collections) {
        return resolve(this.collections[name])
      }

      console.log("Creating datastore " + name)
      var collection = new Collection(name)

      this.collections[name] = collection
      resolve(collection)
    })
  }
}

class Collection {
  constructor(name) {
    this.name = name
    this._store =  new Datastore({
      filename: path.join(DATA_DIR, name +'.db'),
      autoload: true
    })
  }

  _promisize(func, args) {
    return new Promise((resolve, reject) => {
      var eArgs = Array.from(args)
      eArgs.push((err, result) => {
        if (err) {
          return reject(err)
        }
        return resolve(result)
      })
      func.apply(this._store, eArgs)
    })
  }
  
  find(q) {
    if (q === undefined) {
      q = {}
    }
    return this._promisize(this._store.find, [q])
  }

  insert() {
    return this._promisize(this._store.insert, arguments)
  }

  update() {
    return this._promisize(this._store.update, arguments)
  }
}

const dataStore = new DatastoreManager()

export default dataStore;