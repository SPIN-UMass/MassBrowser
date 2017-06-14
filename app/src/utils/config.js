import packageJSON from 'package.json'

const Config = {
  sentry: {
    enabled: true,
    version: '',
    dsn: ''
  },
  log: {
    level: 'info'
  }
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

updateConfig(Config, pConfig)

if (process.env.NODE_ENV === 'development') {
  updateConfig(Config, devConfig)
} else {
  updateConfig(Config, prodConfig)
}

export default Config
