import { EventEmitter } from 'events'
import KVStore from '@utils/kvstore'


class _Context extends EventEmitter {
  constructor () {
    super()
    this.hasBooted = false

    // Keeping cache of kvstore values to avoid some race conditions
    this._registered = false
    this._browserIntegrationCompleted
  }

  bootFinished() {
    this.hasBooted = true
  }

  async hasRegistered() {
    return this._registered || !!(await KVStore.get('client'))
  }

  registerClient(client) {
    this._registered = true
    return KVStore.set('client', client)
  }

  async hasInvitationCode() {
    return !!(await KVStore.get('invitationCode'))
  }

  setInvitationCode(invitationCode) {
    return KVStore.set('invitationCode', invitationCode)
  }

  async hasCompletedBrowserIntegration() {
    return this._browserIntegrationCompleted || !!(await KVStore.get('browser-integration-completed'))
  }

  async browserIntegrationCompleted() {
    this._browserIntegrationCompleted = true
    await KVStore.set('browser-integration-completed', true)
    this.emit('browser-integration-completed')
  }
}

const Context = new _Context()
export default Context
