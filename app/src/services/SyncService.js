import API from '../api'
import KVStore from '~/utils/kvstore'
import { Website, Domain, CDN, Region, Category } from '~/models'

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
      this.syncRegions(),
      this.syncCDNs()
    ])
  }

  syncWebsites () {
    return this._sync('websites', this._websiteSync)
  }
  
  syncDomains () {
    return this._sync('domains', this._domainSync)
  }

  syncCategories() {
    return this._sync('categories', this._categorySync)
  }

  syncRegions() {
    return this._sync('regions', this._regionSync)
  }
  
  syncCDNs() {
    return this._sync('cdns', this._cdnSync)
  }

  _getLastSyncTime (entity) {
    return KVStore.get('last-sync-' + entity)
      .then(value => value || 0)
  }

  _updateLastSyncTime (entity, syncTime) {
    return KVStore.set('last-sync-' + entity, syncTime)
  }

  _sync (entity, syncFunction) {
    const getTimes = Promise.all([
      this._getLastSyncTime(entity),
      API.getLastModificationTime(entity)
    ])

    return getTimes
      .then(([lastSyncTime, lastModifiedTime]) => {
        if (lastModifiedTime > lastSyncTime) {
          console.debug(entity + ' sync is required, fetching modified items')
      
          return syncFunction.call(this, lastSyncTime)
            .then(() => {
              this._updateLastSyncTime(entity, lastModifiedTime)
            })
        }
      
        console.debug(entity + ' database up-to-date')
      })
  }

  _websiteSync (lastSyncTime) {
    return API.getWebsites(lastSyncTime)
      .then(items => this._saveItems(Website, items))
      .then(items => console.log(items.length + ' websites synced'))
  }

  _domainSync (lastSyncTime) {
    return API.getDomains(lastSyncTime)
      .then(items => this._saveItems(Domain, items))
      .then(items => console.log(items.length + ' domains synced'))
  }

  _categorySync (lastSyncTime) {
    return API.getCategories(lastSyncTime)
      .then(items => this._saveItems(Category, items))
      .then(items => console.log(items.length + ' categories synced'))
  }

  _regionSync (lastSyncTime) {
    return API.getRegions(lastSyncTime)
      .then(items => this._saveItems(Region, items))
      .then(items => console.log(items.length + ' regions synced'))
  }

  _cdnSync (lastSyncTime) {
    return API.getCDNs(lastSyncTime)
      .then(items => this._saveItems(CDN, items))
      .then(items => console.log(items.length + ' CDNs synced'))
  }

  _saveItems(Model, items) {
    var savePromises = []
    items.forEach(itemInfo => {
      savePromises.push(Model.findOne({_id: itemInfo._id})
        .then(item => {
          if (!item) {
            var item = new Model()
          }

          Object.assign(item, itemInfo)              
          return item.save()
        })
      )
      
    })
    return Promise.all(savePromises)
  }
}

const SyncService = new _SyncService()
export default SyncService
