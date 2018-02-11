import API from '@/api'
import KVStore from '@utils/kvstore'
import { debug, info } from '@utils/log'
import { Website, Domain, CDN, Region, Category } from '@/models'

import { SyncService as BaseSyncService, SyncProgress } from '@common/services'
import { store } from '@utils/store'

class SyncService extends BaseSyncService {
  syncAll () {
    let progress = new SyncProgress(4)

    return Promise.all([
      this.syncWebsites(progress),
      this.syncDomains(progress),
      this.syncCategories(progress),
      this.syncCDNs(progress)
    ])
  }

  
  async syncAllowedCategories () {
    const allowedCategories = await API.getAllowedCategories();
    
    var allowedIDs = []
    allowedCategories.forEach((cat) => {
      allowedIDs.push(cat.id)
    })

    const categories = await Category.find();
    const promises = categories.map((category) => {
      category.enabled = allowedIDs.indexOf(category.id) > -1
      return category.save()
    })
    
    return Promise.all(promises)
  }

  /**
   * Not currently used
   */
  async syncServerAllowedCategories () {
    let categories = await Category.find({enabled: true})
    var allowedIDs = []
    categories.forEach((cat) => {
      allowedIDs.push(cat.id)
    })
    await API.setAllowedCategories(allowedIDs)
    debug('Category settings updated on server')
    return categories;
  }
}

export const syncService = new SyncService()
export default syncService
