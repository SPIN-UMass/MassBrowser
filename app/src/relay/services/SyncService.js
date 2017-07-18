import API from '~/relay/api'
import KVStore from '~/utils/kvstore'
import { debug, info } from '~/utils/log'

import { Website, Domain, CDN, Region, Category } from '~/relay/models'

class _SyncService {
  constructor () {
  }

  start () {

  }

  syncAll () {
    return Promise.all([
      this.syncWebsites(),
      this.syncDomains(),
      this.syncCategories(),
      this.syncCDNs()
    ])
  }

  syncWebsites () {
    return this._sync('websites', Website)
  }

  syncDomains () {
    return this._sync('domains', Domain)
  }

  syncCategories () {
    return this._sync('categories', Category)
  }

  syncRegions () {
    return this._sync('regions', Region)
  }

  syncCDNs () {
    return this._sync('cdns', CDN)
  }

  /**
   * @returns a Promise which will resolve with a boolean, which is true
   * if the local database is empty
   */
  isFirstSync() {
    return Website.find()
    .then(websites => websites.length === 0)
  }

  _getLastSyncTime (entity) {
    return KVStore.get('last-sync-' + entity)
      .then(value => value ? new Date(value) : new Date("1993"))
  }

  _updateLastSyncTime (entity, syncTime) {
    return KVStore.set('last-sync-' + entity, new Date(syncTime))
  }

  _sync (entity, model) {
    const getTimes = Promise.all([
      this._getLastSyncTime(entity),
      API.getLastModificationTime(entity)
    ])
    
    var itemCount = 0
    const ITEMS_PER_SYNC = 100
    const savePromises = []

    const requestItems = (lastSyncTime, limit, offset) => {
      return API.syncDatabase(entity, lastSyncTime, limit, offset)
      .then(response => {
        savePromises.push(this._saveItems(model, response.results))

        itemCount += response.results.length
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

        debug(entity + ' database up-to-date')
      })
  }

  _saveItems (Model, items) {
    var savePromises = []
    items.forEach(itemInfo => {
      savePromises.push(Model.findOne({_id: itemInfo._id})
        .then(item => {
          if (!item) {
            var item = new Model()
          }
          
          item.assignJson(itemInfo)
          return item.save()
        })
      )
    })
    return Promise.all(savePromises)
  }
}

const SyncService = new _SyncService()
export default SyncService
