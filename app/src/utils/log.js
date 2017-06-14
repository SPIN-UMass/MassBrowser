import winston from 'winston'

import Config from '~/utils/config'

class BrowserConsoleTransport extends winston.Transport {
  constructor(options) {
    super(options)
    options = options || {}
    
    this.name = 'browserConsoleLogger'
    this.level = options.level || 'info'
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

var Log = new (winston.Logger)({
  level: Config.log.level,
  transports: transports
})

export default Log