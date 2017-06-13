import { sentry } from 'package.json'

export const Raven = require('raven-js')
export const RavenVue = require('raven-js/plugins/vue')

export default Raven


Raven.smartConfig = function(options) {
  var options = options || {}

  var dsn = process.env.NODE_ENV == 'development' ? sentry.dev.dsn : sentry.prod.dsn
  
  if (options.interface !== 'commandline' && options.interface !== 'gui') {
    throw new Error(`Invalid env ${env}`)
  }

  var config = {
    release: sentry.version,
    environment: process.env.NODE_ENV,
    tags: {
      'app.interface': options.interface,
      'app.role': options.role
    }
  }

  return Raven.config(dsn, config)
}