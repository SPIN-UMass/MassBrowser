export class State {
  constructor(defaultValue) {
    this.value = defaultValue
  }
}

/**
 * A state defined with this class will be cached in the browser localstorage
 */
export class RendererCachedPersistedState extends State {}

export class PersistedState extends State {}

export function parseStoreConfig(storeConfig) {
  let state = {}
  let stateConfig = {}

  for (let key in storeConfig.state) {
    let value = storeConfig.state[key]
    let config = {
      persist: false,
      cache: false
    }

    while (value instanceof State) {
      if (value instanceof PersistedState) {
        config.persist = true
      } else if (value instanceof RendererCachedPersistedState) {
        config.cache = true
      }

      value = value.value
    }

    state[key] = value      
    stateConfig[key] = config
  }

  return {
    state: state,
    stateConfig: stateConfig
  }
}