import { createController } from '@utils/remote'
import { Website } from '@/models'

async function getWebsites() {
  return await Website.find({thirdParty: false})
}

async function toggleWebsite(websiteID, enabled) {
  return await Website.update({id: websiteID}, {$set: {enabled}})
}

export default createController('websites', {
  getWebsites,
  toggleWebsite
})