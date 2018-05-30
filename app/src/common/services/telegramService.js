
import { getDataDir } from '@utils'
import KVStore from '@utils/kvstore'
import { HttpTransport } from '@utils/transport'
import config from '@utils/config'
import log from '@utils/log'

import path from 'path'
import fs from 'fs-extra'


const telegramFilePath = path.join(getDataDir(), config.configFoldername, 'telegramlist')
class TelegramService {
  constructor() {
    this.ipSet = new Set()
  }

  isTelegramIP(ip) {
    return this.ipSet.has(ip)
  }

  async requiresDownload() {
    const lastUpdate = KVStore.get('telegramlist-lastupdate');
    if (!lastUpdate || new Date() - lastUpdate > config.telegram.listUpdateInterval) {
      return true;
    }
    return !(await fs.pathExists(telegramFilePath));
  }

  async loadTelegramList() {
    this.ipSet.clear()
    const telegramList = (await fs.readFile(telegramFilePath)).toString()
    const telegramIPs = telegramList.split(/\r?\n/)
    const ipRegex = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/
    telegramIPs.forEach(ip => ipRegex.test(ip) ? this.ipSet.add(ip) : null)
    log.debug(`Loaded ${this.ipSet.size} Telegram addresses`)
  }

  async downloadTelegramList() {
    const http = new HttpTransport()
    const response = await http.get(config.telegram.listURL)
  
    await fs.writeFile(telegramFilePath, response.data)
    await KVStore.set('telegramlist-lastupdate', (new Date()).getTime())
  }
}

export const telegramService = new TelegramService()
export default telegramService
