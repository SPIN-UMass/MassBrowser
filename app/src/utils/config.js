import packageJSON from 'package.json'

const defaultConfig = {
  client: {
    socksPort: 7080,
    cachebrowser: {
      mitmPort: 6425
    },
    web: {
      port: 6423,
      domain: null
    },
    noHostHandlerPort: 6422
  },
  relay: {
    natEnabled: true,
    port: 8040   /* Only used if natEnabled is false */
  },
  sentry: {
    enabled: true,
    version: '',
    dsn: ''
  },
  log: {
    level: 'info'
  },
  relayConnectionTimeout: 5000
}

function initializeConfig(env, role, applicationInterface) {
  if (role !== 'client' && role !== 'relay') {
    throw new Error("Invalid configuration role")
  }

  const config = {}

  function updateConfig (baseConfig, newConfig) {
      Object.keys(newConfig).forEach(key => {
        if (key in baseConfig && (typeof (baseConfig[key]) === 'object' && typeof (newConfig[key]) === 'object')) {
          return updateConfig(baseConfig[key], newConfig[key])
        } else if (newConfig[key] !== undefined) {
          baseConfig[key] = newConfig[key]
        }
      })
  }
  
  function configureWith(pConfig) {
    let devConfig = pConfig.dev || {}
    let prodConfig = pConfig.prod || {}
    pConfig.dev = undefined
    pConfig.prod = undefined

    let roleConfig = pConfig[role] || {}
    let roleDevConfig = pConfig[role].dev || {}
    let roleProdConfig = pConfig[role].prod || {}
    roleConfig.prod = undefined
    roleConfig.dev = undefined
    
    pConfig['client'] = undefined
    pConfig['relay'] = undefined

    updateConfig(config, pConfig)
    updateConfig(config, roleConfig)

    if (env === 'development') {
      updateConfig(config, devConfig)
      updateConfig(config, roleDevConfig)
    } else {
      updateConfig(config, prodConfig)
      updateConfig(config, roleProdConfig)
    }    
  }

  configureWith(defaultConfig)
  configureWith(packageJSON.config)
  
  
  if (env === 'development') {
    console.log("Running in development mode")
    config.environment == 'development'
    config.isDevelopment = true
    config.isProduction = false
  } else {
    config.environment == 'production'
    config.isDevelopment = false
    config.isProduction = true
  }

  config.role = role
  config.isClient = role === 'client'
  config.isRelay = role === 'relay'

  config.applicationInterface = applicationInterface

  return config
}

const config = initializeConfig(
  process.env.NODE_ENV,
  process.env.ROLE,
  process.env.APP_INTERFACE
)

export default config
