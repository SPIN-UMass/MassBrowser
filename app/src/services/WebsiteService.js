import API from '../api'
import Datasore from '../renderer/datastore'

class WebsiteService {
  constructor () {
    this.enabledWebsites = new Set()
  }

  start () {
    this._loadEnabledWebsites()
  }

  _loadEnabledWebsites () {
    console.log('Loading enabled websites set')
    Datasore.getItem('enabled-websites')
      .then(enabledWebsites => {
        enabledWebsites = enabledWebsites || []
        this.enabledWebsites.clear()
        enabledWebsites.forEach(website => { this.enabledWebsites.add(website) })
      })
  }

  _saveEnabledWebsites () {
    Datasore.setItem('enabled-websites', Array.from(this.enabledWebsites))
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
    return Datasore.getItem('last-website-sync')
      .then(value => value || 0)
  }

  updateLastSyncTime (syncTime) {
    return Datasore.setItem('last-website-sync', syncTime)
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
        return Datasore.collection('websites')
          .then(websiteCollection => {
            websites.forEach(website => {
              websiteCollection.update({_id: website._id}, website, {upsert: true})
            })
          }).then(() => {
            return [websites, lastModifiedTime, lastSyncTime]
          })
      })
  }
}

const websiteService = new WebsiteService()
export default websiteService
