import { EventEmitter } from 'events'

class StatusManager {
  constructor (bus) {
    this.statuses = []
    this.idCounter = 0
    this.bus = bus

    this.bus.on('status-request', () => {
      if (this.statuses.length) {
        this.bus.emit('status-changed', this.statuses[this.statuses.length - 1])
      }
    })
  }

  removeStatus (statusID) {
    let index = this.statuses.findIndex(s => s.id === statusID)
    if (index === this.statuses.length - 1) {
      this.statuses.pop()

      if (!this.statuses.length) {
        this.bus.emit('status-cleared')
      } else {
        this.bus.emit('status-changed', this.statuses[this.statuses.length - 1])
      }
    } else {
      this.statuses.splice(index, 1)
    }
  }

  removeAll () {
    this.statuses = []
    this.bus.emit('status-cleared')
  }

  addStatus (key, message, options) {
    options = options || {}

    let status = {
      id: key || this.idCounter++,
      text: message,
      options: options
    }

    if (options.timeout) {
      let timeout = options.timeout === true ? 4000 : options.timeout
      setTimeout(() => { this.removeStatus(status) }, timeout)
    }

    this.statuses.push(status)
    this.bus.emit('status-changed', status)

    return {
      id: status.id,
      clear: () => { this.removeStatus(status.id) }
    }
  }
}

class _Status extends EventEmitter {
  constructor () {
    super()
    this._statusManager = new StatusManager(this)
  }

  setBus (bus) {
    this._statusManager.bus = bus
  }

  clear (key) {
    this._statusManager.removeStatus(key)
  }

  clearAll () {
    this._statusManager.removeAll()
  }

  status (level, arg1, arg2, arg3) {
    var key, message, options

    if (typeof (arg1) === 'string' && typeof (arg2) === 'string') {
      key = arg1
      message = arg2
      options = arg3
    } else {
      key = null
      message = arg1
      options = arg2
    }

    console.log(`Status: ${message}`)

    return this._statusManager.addStatus(key, message, options)
  }

  info (key, message, options) {
    return this.status('info', key, message, options)
  }

  error (key, message, options) {
    return this.status('error', key, message, options)
  }
}

const Status = new _Status()
export default Status
