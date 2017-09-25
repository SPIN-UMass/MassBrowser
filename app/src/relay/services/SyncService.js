import API from '@/api'
import KVStore from '@utils/kvstore'
import { debug, info } from '@utils/log'
import { Website, Domain, CDN, Region, Category } from '@/models'

import { SyncService as BaseSyncService } from '@common/services'

class SyncService extends BaseSyncService {
  syncAll () {
    return Promise.all([
      this.syncWebsites(),
      this.syncDomains(),
      this.syncCategories(),
      this.syncCDNs(),
      this.syncAllowedCategories()
    ])
  }

  
  syncAllowedCategories () {
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

  syncServerAllowedCategories () {
    Category.find({enabled: true})
      .then(categories => {
        var allowedIDs = []
        categories.forEach((cat) => {
          allowedIDs.push(cat.id)
        })
        API.setAllowedCategories(allowedIDs).then((d) => {
          debug('Categories saved')
        })
      })
  }
}

export const syncService = new SyncService()
export default syncService
