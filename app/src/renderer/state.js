import Bus from './bus'

class State {
  constructor() {
    this.relays = []
  }

  getRelays() {
    return this.relays
  }

  setRelays(relays) {
    let oldVal = this.relays
    this.relays = relays
    this.emit('relays', relays, oldVal)
  }

  emit(state, newVal, oldVal) {
    Bus.$emit('state-changed-' + state, newVal, oldVal)
  }

  listen(state, func) {
    Bus.$on('state-changed-' + state, func)
  }
}

const state = new State()
export default state