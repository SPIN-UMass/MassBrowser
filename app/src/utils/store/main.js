import storeConfig from '@/store'
import { remote } from '@utils/remote'
import { NoSuchMutationError } from '@utils/errors'
import KVStore from '@utils/kvstore'
import { parseStoreConfig } from './common'


class Store {
  constructor(storeConfig){
    let parsedConfig = parseStoreConfig(storeConfig)
    this.state = parsedConfig.state
    this.stateConfig = parsedConfig.stateConfig
    
    this.proxyState = new Proxy(this.state, {
      set: (target, property, value) => {
        target[property] = value
        if (this.stateConfig[property].persist) {
          this.saveKey(property)
        }
        return true
      }
    })

    this.mutations = storeConfig.mutations

    this.requestIDCounter = 0
    this.pendingRequests = {}

    let loadingPromise = this.loadPersistedStates()

    remote.registerService('store', {
      'getState': async () => {
        await loadingPromise
        return this.state
      }
    })

    remote.on('store.commit.ack', (sender, requestID) => {
      this.pendingRequests[requestID]()
    })
  }

  commit(name, arg) {
    let mutation = this.mutations[name]
    if (mutation === undefined) {
      throw new NoSuchMutationError(name)
    }

    let requestID = this.requestIDCounter++

    mutation(this.proxyState, arg)

    remote.send('store.commit', { requestID, name, arg })

    return new Promise((resolve, reject) => {
      this.pendingRequests[requestID] = resolve
    })
  }

  saveKey(name) {
    return KVStore.set(name, this.state[name])
  }

  async loadPersistedStates() {
    for (let key in this.state) {
      if (!this.stateConfig[key].persist) {
        continue
      }
      let val = await KVStore.get(key)
      this.state[key] = val
    }
  }
}

export const store = new Store(storeConfig)