import packageJSON from 'package.json'

const config = {
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


function updateConfig(baseConfig, newConfig) {
  Object.keys(newConfig).forEach(key => {
    if (key in baseConfig && (typeof(baseConfig[key]) === 'object' && typeof(newConfig[key]) === 'object')) {
      return updateConfig(baseConfig[key], newConfig[key])
    } else if (newConfig[key] !== undefined) {
      baseConfig[key] = newConfig[key]
    }
  })
}

updateConfig(config, pConfig)

if (process.env.NODE_ENV === 'development') {
  updateConfig(config, devConfig)
} else {
  updateConfig(config, prodConfig)
}

export default config
