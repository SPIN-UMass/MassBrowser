import Vuex from 'vuex'
import Vue from 'vue'

import { getService, remote } from '@utils/remote'
import storeConfig from '@/store'
import { parseStoreConfig } from './common'
import electron from 'electron'
import config from '@utils/config'

let { state, stateConfig } = parseStoreConfig(storeConfig, config)

let currentWindow = electron.remote.getCurrentWindow();
let runID = currentWindow.runID
let firstBoot = localStorage.getItem('runID') !== runID
if (firstBoot) {
  localStorage.setItem('runID', runID)
}

for (let key in stateConfig) {
  if (stateConfig[key].cache) {
    if (firstBoot && !stateConfig[key].persist) {
      localStorage.removeItem(key)
      continue      
    }

    let cachedValue = localStorage.getItem(key)
    
    if (!isNaN(cachedValue)) {
      cachedValue = Number(cachedValue)
    } else if (cachedValue === 'false') {
      cachedValue = false
    } else if (cachedValue === 'true') {
      cachedValue = true
    } else if (cachedValue === 'null') {
      cachedValue = null
    } else if (cachedValue === 'undefined') {
      cachedValue = undefined
    }

    if (cachedValue !== null) {
      state[key] = cachedValue
    }
  }
}

let parsedConfig = Object.assign({}, storeConfig)
parsedConfig.state = state
parsedConfig.getters = storeConfig.getters

Vue.use(Vuex)
export const store = new Vuex.Store(parsedConfig)

for (let key in stateConfig) {
  if (stateConfig[key].cache) {
    let k = key
    store.watch((state) => state[k], (value) => {
      localStorage.setItem(k, value) 
    })
  }
}

const remoteStore = getService('store')
remoteStore.getState().then((remoteState) => {
  store.replaceState(remoteState)
})

remote.on('store.commit', (sender, details) => {
  store.commit(details.name, details.arg)
  remote.send('store.commit.ack', details.requestID)
})