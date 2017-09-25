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
      this.syncRegions(),
      this.syncCDNs()
    ])
  }
}

export const syncService = new SyncService()
export default syncService
