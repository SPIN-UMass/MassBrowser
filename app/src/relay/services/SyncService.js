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
      this.syncCDNs(progress),
      this.syncAllowedCategories()
    ])
  }

  
  syncAllowedCategories () {
    // Needs to be registerd
    if (!store.state.relay) {
      return
    }

    API.getAllowedCategories().then((allowedCategories) => {
      var allowedIDs = []
      allowedCategories.forEach((cat) => {
        allowedIDs.push(cat.id)
      })
      Category.find()
        .then(categories => {

          categories.forEach((category) => {
            // console.log('allowedIDS', allowedIDs, category.id, allowedIDs.indexOf(category.id) > -1)

            if (allowedIDs.indexOf(category.id) > -1) {
              category.enabled = true
            } else {
              category.enabled = false
            }
            category.save()
          })
        })

    })
  }

  async syncServerAllowedCategories () {
    let categories = await Category.find({enabled: true})
    var allowedIDs = []
    categories.forEach((cat) => {
      allowedIDs.push(cat.id)
    })
    await API.setAllowedCategories(allowedIDs)
    debug('Category settings updated on server')
  }
}

export const syncService = new SyncService()
export default syncService
