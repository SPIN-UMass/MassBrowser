import Vue from 'vue'


class _Bus {
  constructor() {
    this._bus = new Vue()
    this.on = this._bus.$on
    this.emit = this._bus.$emit
  }
}

const Bus = new _Bus()

export default Bus
