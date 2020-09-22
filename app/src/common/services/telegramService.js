// TorService class aims at maintaining an up-to-date Tor IP
// list. Therefore, whenever a buddy see a new connection request to a
// IP in that list, it can decide to provide the service or not.

// Note that there are at least tow things we can improve:
// 1. Currently, the Telegram IP list is uploaded to the
// domian-fronted server by developers manually. It would keep the
// list more up-to-date if a script can be used or we figure out a way
// to download Tor consensus directly from client (need to find a
// Javascript Tor controller library as stem for python).

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
    console.log("Telegram Service Loaded!")
  }

  isTelegramIP(ip) {
    return this.ipSet.has(ip)
  }

  // requiresDownload() returns true if the Telegram list expires or
  // does not exist
  async requiresDownload() {
    const lastUpdate = KVStore.get('telegramlist-lastupdate');
    if (!lastUpdate || new Date() - lastUpdate > config.telegram.listUpdateInterval) {
      return true;
    }
    return !(await fs.pathExists(telegramFilePath));
  }

  // loadTelegramList() loads all the IPs from the Telegram lists to
  // the ipSet
  async loadTelegramList() {
    this.ipSet.clear()
    const telegramList = (await fs.readFile(telegramFilePath)).toString()
    const telegramIPs = telegramList.split(/\r?\n/)
    const ipRegex = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/
    telegramIPs.forEach(ip => ipRegex.test(ip) ? this.ipSet.add(ip) : null)
    log.debug(`Loaded ${this.ipSet.size} Telegram addresses`)
  }

  // downloadTelegramList() downloads the Telegram lists from a server
  async downloadTelegramList() {
    // Note that we do not need to take care of domain-fronting here,
    // since it is handled automitically by the cachebrowser.
    const http = new HttpTransport()
    const response = await http.get(config.telegram.listURL)

    await fs.writeFile(telegramFilePath, response.data)
    await KVStore.set('telegramlist-lastupdate', (new Date()).getTime())
  }
}

export const telegramService = new TelegramService()
export default telegramService
