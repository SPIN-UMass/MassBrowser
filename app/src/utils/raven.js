import config from '~/utils/config'
import { warn, info } from '~/utils/log'

export const Raven = require('raven-js')
export const RavenVue = require('raven-js/plugins/vue')

export default Raven

Raven.smartConfig = function (options) {
  var options = options || {}

  var appInterface = process.env.APP_INTERFACE
  if (appInterface !== 'commandline' && appInterface !== 'electron') {
    throw new Error(`Invalid application interface ${appInterface}, please set correct value for the APP_INTERFACE env variable`)
  }

  if (!config.sentry.dsn) {
    warn('sentry DSN not provided in config, will not be using sentry')
  }

  var options = {
    release: config.sentry.version,
    environment: process.env.NODE_ENV,
    tags: {
      'app.interface': options.interface,
      'app.role': options.role
    }
  }

  info(`Using sentry with dsn '${config.sentry.dsn}'`)

  return Raven.config(config.sentry.dsn, options)
}
