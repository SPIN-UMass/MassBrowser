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
      /* Errors are passed in as the meta object instead of the msg, so
         a simple hack to print errors correctly */
      if (level === 'error' && !msg) {
        handler(meta)
      } else {
        handler(msg)
      }
    }
  }
}

export function initializeLogging() {
  var transports = [
    new (winston.transports.Console)()
  ]

  if (config.applicationInterface == 'electron') {
    transports.push(new BrowserConsoleTransport())
  }

  logger.configure({
    level: config.log.level,
    transports: transports
  })
}

export const logger = new (winston.Logger)()  
export const log = logger.log
export const info = logger.info
export const warn = logger.warn
export const debug = logger.debug
export const error = logger.error

export default logger


