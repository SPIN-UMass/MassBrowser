
import { getDataDir } from '@utils'
import KVStore from '@utils/kvstore'
import { HttpTransport } from '@utils/transport'
import config from '@utils/config'
import log from '@utils/log'

import path from 'path'
import fs from 'fs-extra'


log.debug(`MMMMM ${config.configFoldername}`)
const torFilePath = path.join(getDataDir(), config.configFoldername, 'torlist')
log.debug(`MMMMM ${config.configFoldername} , ${torFilePath}`)
class TorService {
  constructor() {
    this.ipSet = new Set()
  }

  isTorIP(ip) {
    return this.ipSet.has(ip)
  }

  async requiresDownload() {
    const lastUpdate = KVStore.get('torlist-lastupdate');
    if (!lastUpdate || new Date() - lastUpdate > config.tor.listUpdateInterval) {
      return true;
    }
    return !(await fs.pathExists(torFilePath));
  }

  async loadTorList() {
    this.ipSet.clear()
    const torList = (await fs.readFile(torFilePath)).toString()
    const torIPs = torList.split(/\r?\n/)
    const ipRegex = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/
    torIPs.forEach(ip => ipRegex.test(ip) ? this.ipSet.add(ip) : null)
    log.debug(`Loaded ${this.ipSet.size} Tor addresses`)
  }

  async downloadTorList() {
    const http = new HttpTransport()
    const response = await http.get(config.tor.listURL)
  
    await fs.writeFile(torFilePath, response.data)
    await KVStore.set('torlist-lastupdate', (new Date()).getTime())
  }
}

export const torService = new TorService()
export default torService
