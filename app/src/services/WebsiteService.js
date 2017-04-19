import API from '../api'
import KVStore from '~/utils/kvstore'
import Website from '~/models/Website'


class WebsiteService {
  constructor () {
  }

  start () {

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
          savePromises.push(Website.findOne({_id: websiteInfo._id})
            .then(website => {
              if (!website) {
                var website = new Website()
              }

              Object.assign(website, websiteInfo)              
              return website.save()
            })
          )
          
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
