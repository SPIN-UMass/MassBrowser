// TorService class aims at maintaining an up-to-date Tor IP
// list. Therefore, whenever a buddy see a new connection request to a
// IP in that list, it can decide to provide the service or not.

// Note that there are at least tow things we can improve:
// 1. Currently, the Tor IP list is downloaded and from Tor consensus
// and then is uploaded to the domian-fronted server by developers
// manually. It would keep the list more up-to-date if a script can be
// used or we figure out a way to download Tor consensus directly from
// client (need to find a Javascript Tor controller library as stem
// for python).
// 2. The Tor IPs we can get is from Tor consensus and they are all
// public relays. Therefore, users who connect to an unpublished Tor
// relay/bridge can still use the Tor network even when the Mass buddy
// does not want to proxy traffic to the Tor network.


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

  // requiresDownload() returns true if the Tor list expires or does
  // not exist
  async requiresDownload() {
    const lastUpdate = KVStore.get('torlist-lastupdate');
    if (!lastUpdate || new Date() - lastUpdate > config.tor.listUpdateInterval) {
      return true;
    }
    return !(await fs.pathExists(torFilePath));
  }

  // loadTorList() loads all the IPs from the Tor lists to the ipSet
  async loadTorList() {
    this.ipSet.clear()
    const torList = (await fs.readFile(torFilePath)).toString()
    const torIPs = torList.split(/\r?\n/)
    const ipRegex = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/
    torIPs.forEach(ip => ipRegex.test(ip) ? this.ipSet.add(ip) : null)
    log.debug(`Loaded ${this.ipSet.size} Tor addresses`)
  }

  // downloadTorList() downloads the Tor lists from a server
  async downloadTorList() {
    // Note that we do not need to take care of domain-fronting here,
    // since it is handled automitically by the cachebrowser.
    const http = new HttpTransport()
    const response = await http.get(config.tor.listURL)

    await fs.writeFile(torFilePath, response.data)
    await KVStore.set('torlist-lastupdate', (new Date()).getTime())
  }
}

export const torService = new TorService()
export default torService
