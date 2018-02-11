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

export class RendererCachedState extends State {}

export class ConfigDefault {
  constructor(configName) {
    this.configName = configName;
  }
}

export const fromConfig = name => new ConfigDefault(name);

export function parseStoreConfig(storeConfig, appConfig) {
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
        config.persist = true
      } else if (value instanceof RendererCachedState) {
        config.cache = true
        config.persist = false
      }

      value = value.value
    }

    if (value instanceof ConfigDefault) {
      const configName = value.configName || key;
      state[key] = appConfig.get(configName);
    } else {
      state[key] = value
    }

    stateConfig[key] = config
  }

  return {
    state: state,
    stateConfig: stateConfig
  }
}