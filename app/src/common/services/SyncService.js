import API from '@/api'
import KVStore from '@utils/kvstore'
import { debug, info } from '@utils/log'
import { store } from '@utils/store'
import { Website, Domain, CDN, Region, Category } from '@/models'


export class SyncService {
  syncWebsites (progress) {
    return this._sync('websites', Website, progress)
  }

  syncDomains (progress) {
    return this._sync('domains', Domain, progress)
  }

  syncCategories (progress) {
    return this._sync('categories', Category, progress)
  }

  syncRegions (progress) {
    return this._sync('regions', Region, progress)
  }

  syncCDNs (progress) {
    return this._sync('cdns', CDN, progress)
  }

  /**
   * @returns a Promise which will resolve with a boolean, which is true
   * if the local database is empty
   */
  isFirstSync () {
    return Website.find()
      .then(websites => websites.length === 0)
  }


  _getLastSyncTime (entity) {
    return KVStore.get('last-sync-' + entity)
      .then(value => value ? new Date(value) : new Date('1993'))
  }

  _updateLastSyncTime (entity, syncTime) {
    return KVStore.set('last-sync-' + entity, new Date(syncTime))
  }

  _sync (entity, model, progress, options) {
    options = options || {}

    const getTimes = Promise.all([
      this._getLastSyncTime(entity),
      API.getLastModificationTime(entity)
    ])

    var itemCount = 0
    const ITEMS_PER_SYNC = 100
    const savePromises = []

    let progressSet = false

    const requestItems = (lastSyncTime, limit, offset) => {
      return API.syncDatabase(entity, lastSyncTime, limit, offset)
        .then(response => {
          savePromises.push(this._saveItems(model, response.results, options))

          itemCount += response.results.length

          if (progress) {
            if (!progressSet) {
              progress.addItems(response.count)
              progressSet = true
            }
            progress.itemsComplete(response.results.length)            
          }

          if (itemCount >= response.count || response.results.length === 0) {
            return itemCount
          } else {
            return requestItems(lastSyncTime, limit, offset + response.results.length)
          }
        })
    }

    return getTimes
      .then(([lastSyncTime, lastModifiedTime]) => {
        if (lastModifiedTime > lastSyncTime) {
          info(entity + ' sync is required, fetching modified items')

          return requestItems(lastSyncTime, ITEMS_PER_SYNC, 0)
            .then(itemCount => info(`${itemCount} ${entity} synced`))
            .then(() => this._updateLastSyncTime(entity, lastModifiedTime))
            .then(() => Promise.all(savePromises))
        }

        if (progress) {
          return progress.addItems(0)
        }

        debug(entity + ' database up-to-date')
      })
  }

  _saveItems (Model, items, options) {
    var savePromises = []
    items.forEach(itemInfo => {
      savePromises.push(Model.findOne({_id: itemInfo._id})
        .then(async item => {
          let isNewItem = !item

          if (isNewItem) {
            item = new Model()
          }

          item.assignJson(itemInfo)
          
          if (options.beforeSave) {
            await options.beforeSave(item)
          }
          
          return item.save()
        })
      )
    })
    return Promise.all(savePromises)
  }
}

export class SyncProgress {
  constructor(typeCount) {
    this.typeCount = typeCount
    this.seen = 0
    this.totalItems = 0
    this.finishedItems = 0
  }

  addItems(count) {
    this.totalItems += count
    this.seen += 1
    return store.commit('setSyncProgress', this.progress)
  }

  itemsComplete(count) {
    this.finishedItems += count
    store.commit('setSyncProgress', this.progress)
  }

  get progress() {
    if (this.seen < this.typeCount) {
      return 0
    }
    if (this.seen == this.typeCount && this.totalItems == 0) {
      return 100
    }
    return Math.ceil(this.finishedItems * 100 / this.totalItems)
  }
}
export default SyncService
