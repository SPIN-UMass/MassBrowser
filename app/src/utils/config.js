import packageJSON from 'package.json'

const config = {
  client: {
    socksPort: 7080,
    cachebrowser: {
      mitmPort: 6425
    }
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

console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV === 'development') {
  console.log("Running in development mode")
  updateConfig(config, devConfig)
} else if (process.env.NODE_ENV === 'production') {
  updateConfig(config, prodConfig)
} else {
  console.error("Environement variable NODE_ENV should be set to 'development' or 'production'")
  process.exit(1)
}

config.applicationInterface = null

export default config
