import API from '../api'
import KVStore from '~/utils/kvstore'
import Website from '~/models/Website'


class WebsiteService {
  constructor () {
    this.enabledWebsites = new Set()
  }

  start () {
    this._loadEnabledWebsites()
  }

  _loadEnabledWebsites () {
    console.log('Loading enabled websites set')
    KVStore.get('enabled-websites')
      .then(enabledWebsites => {
        enabledWebsites = enabledWebsites || []
        this.enabledWebsites.clear()
        enabledWebsites.forEach(website => { this.enabledWebsites.add(website) })
      })
  }

  _saveEnabledWebsites () {
    KVStore.set('enabled-websites', Array.from(this.enabledWebsites))
  }

  isWebsiteEnabled (website) {
    return this.enabledWebsites.has(website)
  }

  setWebsiteEnabled (website, enabled) {
    // Don't do anything if no change is made
    if (this.enabledWebsites.has(website) === enabled) {
      return
    }

    if (enabled) {
      this.enabledWebsites.add(website)
    } else {
      this.enabledWebsites.delete(website)
    }

    this._saveEnabledWebsites()
  }

  getLastSyncTime () {
    return KVStore.get('last-website-sync')
      .then(value => value || 0)
  }

  updateLastSyncTime (syncTime) {
    return KVStore.set('last-website-sync', syncTime)
  }

  syncWebsites () {
    return Promise.all([this.getLastSyncTime(), API.getLastWebsiteModificationTime()])
      .then(([lastSyncTime, lastModifiedTime]) => {
        if (lastModifiedTime > lastSyncTime) {
          console.debug('Website sync is required, fetching modified websites')
          return this._performWebsiteSync(lastModifiedTime, lastSyncTime)
        } else {
          console.debug('Website database up-to-date')
        }
      })
      .then(([_, __, lastSyncTime]) => this.updateLastSyncTime(lastSyncTime))
  }

  _performWebsiteSync (lastModifiedTime, lastSyncTime) {
    return API.getWebsites(lastSyncTime)
      .then(websites => {
        console.log(websites.length + ' websites synced')
        
        var savePromises = []
        websites.forEach(websiteInfo => {
          var website = new Website()
          Object.assign(website, websiteInfo)
          savePromises.push(website.save())
        })

        return Promise.all(savePromises)
          .then(websites => {
            return [websites, lastModifiedTime, lastSyncTime]
          })
      })
  }
}

const websiteService = new WebsiteService()
export default websiteService
