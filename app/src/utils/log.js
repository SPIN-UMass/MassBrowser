import winston from 'winston'

import config from '~/utils/config'

class BrowserConsoleTransport extends winston.Transport {
  constructor (options) {
    super(options)
    options = options || {}

    this.name = 'browserConsoleLogger'
    this.level = options.level
  }

  log (level, msg, meta, callback) {
    var handler = console[level]

    if (handler === undefined) {
      console.log(`${level}: ${msg}`)
    } else {
      handler(msg)
    }
  }
}

var transports = [
  new (winston.transports.Console)()
]

if (process.env.APP_INTERFACE == 'electron') {
  transports.push(new BrowserConsoleTransport())
}

var logger = new (winston.Logger)({
  level: config.log.level,
  transports: transports
})

export default logger

export const log = logger.log
export const info = logger.info
export const warn = logger.warn
export const debug = logger.debug
export const error = logger.error
