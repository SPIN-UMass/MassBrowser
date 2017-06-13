import Bus from './bus'

class StatusManager {
  constructor () {
    this.statuses = []
    this.idCounter = 0

    Bus.$on('status-request', () => {
      if (this.statuses.length) {
        Bus.$emit('status-changed', this.statuses[this.statuses.length - 1])
      }
    })
  }

  removeStatus (status) {
    let index = this.statuses.findIndex(s => s.id === status.id)
    if (index === this.statuses.length - 1) {
      this.statuses.pop()

      if (!this.statuses.length) {
        Bus.$emit('status-cleared')
      } else {
        Bus.$emit('status-changed', this.statuses[this.statuses.length - 1])
      }
    } else {
      this.statuses.splice(index, 1)
    }
  }

  addStatus (message, options) {
    options = options || {}

    let status = {
      id: this.idCounter++,
      text: message,
      options: options
    }

    if (options.timeout) {
      let timeout = options.timeout === true ? 4000 : options.timeout
      setTimeout(() => { this.removeStatus(status) }, timeout)
    }

    this.statuses.push(status)
    Bus.$emit('status-changed', status)

    return {
      id: status.id,
      clear: () => { this.removeStatus(status) }
    }
  }
}

class State {
  constructor () {
    this._statusManager = new StatusManager()
  }

  status (message, options) {
    return this._statusManager.addStatus(message, options)
  }

}

const state = new State()
export default state
