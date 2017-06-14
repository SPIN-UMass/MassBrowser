import Config from '~/utils/config'
import Log from '~/utils/log'

export const Raven = require('raven-js')
export const RavenVue = require('raven-js/plugins/vue')

export default Raven


Raven.smartConfig = function(options) {
  var options = options || {}
  
  var appInterface = process.env.APP_INTERFACE
  if (appInterface !== 'commandline' && appInterface !== 'electron') {
    throw new Error(`Invalid application interface ${appInterface}, please set correct value for the APP_INTERFACE env variable`)
  }

  if (!Config.sentry.dsn) {
    Log.warn("sentry DSN not provided in config, will not be using sentry")
  }
  
  var config = {
    release: Config.sentry.version,
    environment: process.env.NODE_ENV,
    tags: {
      'app.interface': options.interface,
      'app.role': options.role
    }
  }

  return Raven.config(Config.dsn, config)
}