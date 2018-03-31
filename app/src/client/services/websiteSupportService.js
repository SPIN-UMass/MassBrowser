import API from '@/api'
import KVStore from '@utils/kvstore'
import { debug, info } from '@utils/log'
import { store } from '@utils/store'

class WebsiteSupportService {
  async requestWebsiteSupport(hostname) {
    info('Sending request for website support for ' + hostname)
    return API.requestWebsiteSupport(hostname)
  }

}

export const websiteSupportService = new WebsiteSupportService()
export default websiteSupportService
