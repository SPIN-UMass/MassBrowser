import { EventEmitter } from 'events'
import { logger } from '@utils/log'


function randKey () {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1)
}

class LogStatus {
  constructor(manager, key, level, message, options) {
    this.manager = manager
    this.key = key
    this.level = level
    this.message = message
    this.options = options || {}

    if (this.options.timeout) {
      let timeout = this.options.timeout === true ? 4000 : this.options.timeout
      setTimeout(() => { this.manager._removeStatus(status) }, timeout)
    }
  }

  clear() {
    this.manager._removeStatus(this)
  }

  get statusType() {
    return this.manager.STATUS_LOG
  }
}

class ProgressStatus extends EventEmitter {
  constructor(manager, key, message, maxSteps) {
    super()
    this._message = message
    this.manager = manager
    this.key = key
    this.maxSteps = maxSteps || 100
    this.progress = 0
  }

  update(steps) {
    this.setProgress(this.progress + steps)
  }

  setProgress(steps) {
    this.progress = steps

    if (this.progress > this.maxSteps) {
      this.progress = this.maxSteps
    }

    this.emit('update', this)

    if (this.progress === this.maxSteps) {
      this.finish()
    }
  }

  finish() {
    this.manager._removeStatus(this)
    this.emit('finish', this)
  }

  get message () {
    if (typeof this._message === 'function') {
      return this._message(this.progress, this.maxSteps)
    }
    return this._message
  }

  get statusType() {
    return StatusManager.STATUS_PROGRESS
  }
}

class _StatusService extends EventEmitter {
  constructor () {
    super()

    this.statuses = []
    this.idCounter = 0

    this.on('status-request', () => {
      if (this.statuses.length) {
        this.emit('status-changed', this.statuses[this.statuses.length - 1])
      }
    })
  }

  _removeStatus (statusID) {
    let index = this.statuses.findIndex(s => s.key === statusID)
    if (index === this.statuses.length - 1) {
      this.statuses.pop()

      if (!this.statuses.length) {
        this.emit('status-cleared')
      } else {
        this.emit('status-changed', this.statuses[this.statuses.length - 1])
      }
    } else {
      this.statuses.splice(index, 1)
    }
  }

  _removeAll () {
    this.statuses = []
    this.emit('status-cleared')
  }

  _addStatus (status) {
    this.statuses.push(status)
    this.emit('status-changed', status)
  }

  /* --- API ---  */

  clear (key) {
    this._removeStatus(key)
  }

  clearAll () {
    this._removeAll()
  }

  status (level, arg1, arg2, arg3) {
    var key, message, options

    if (typeof (arg1) === 'string' && typeof (arg2) === 'string') {
      key = arg1
      message = arg2
      options = arg3
    } else {
      key = randKey()
      message = arg1
      options = arg2
    }

    let logStatus = new LogStatus(this, key, level, message, options)
    logger.status(message)

    this._addStatus(logStatus)
    return logStatus
  }

  info (key, message, options) {
    return this.status('info', key, message, options)
  }

  error (key, message, options) {
    return this.status('error', key, message, options)
  }

  progress(key, message, maxSteps) {
    if (typeof message !== 'string' && typeof message !== 'function') {
      maxSteps = message
      message = key
      key = randKey()
    }

    let progressStatus = new ProgressStatus(this, key, message, maxSteps)
    this._addStatus(progressStatus)
    return progressStatus
  }

  get STATUS_LOG () {
    return 'log'
  }

  get STATUS_PROGRESS () {
    return 'progress'
  }
}

const StatusService = new _StatusService()
export default StatusService
