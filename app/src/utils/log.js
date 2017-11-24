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
  // TODO remove
}

export var logger, log, status, info, warn, debug, error

// TODO fix this, need to seperate electron main and renderer process
if (config.isDebug || (config.isDevelopment && config.isElectronRendererProcess)) {
  logger = console
  logger.status = console.log
} else {
  logger = new (winston.Logger)()

  var transports = [
    new (winston.transports.Console)({
      colorize: true,
      prettyPrint: true,
      depth: 2,
      humanReadableUnhandledException: true,
      showLevel: true,
      timestamp: false
    })
  ]

  if (config.isElectronRendererProcess) {
    transports.push(new BrowserConsoleTransport())
  }

  logger.configure({
    level: config.log.level,
    transports: transports,
    levels: {
      error: 0,
      warn: 1,
      status: 2,
      info: 3,
      debug: 4
    },
    colors: {
      error: 'red',
      warn: 'yellow',
      status: 'magenta',
      info: 'green',
      debug: 'blue'
    }
  })
}

log = logger.log
status = logger.status
info = logger.info
warn = logger.warn
debug = logger.debug
error = logger.error

export default logger


