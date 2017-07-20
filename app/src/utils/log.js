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
  if (config.isDevelopment && config.applicationInterface == 'electron') {
    logger = console
  } else {
    logger = new (winston.Logger)()  
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
  
  log = logger.log
  info = logger.info
  warn = logger.warn
  debug = logger.debug
  error = logger.error
}

export var logger, log, info, warn, debug, error

export default logger


