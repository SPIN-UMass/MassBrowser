import packageJSON from 'package.json'

const config = {
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

var pConfig = packageJSON.config
var devConfig = pConfig.dev
var prodConfig = pConfig.prod

pConfig.dev = undefined
pConfig.prod = undefined

function updateConfig (baseConfig, newConfig) {
  Object.keys(newConfig).forEach(key => {
    if (key in baseConfig && (typeof (baseConfig[key]) === 'object' && typeof (newConfig[key]) === 'object')) {
      return updateConfig(baseConfig[key], newConfig[key])
    } else if (newConfig[key] !== undefined) {
      baseConfig[key] = newConfig[key]
    }
  })
}

updateConfig(config, pConfig)

if (process.env.NODE_ENV === 'development') {
  console.log("Running in development mode")
  updateConfig(config, devConfig)
  config.environment == 'development'
  config.isDevelopment = true
  config.isProduction = false
} else {
  updateConfig(config, prodConfig)
  config.environment == 'production'
  config.isDevelopment = false
  config.isProduction = true
}

config.applicationInterface = null

export default config
