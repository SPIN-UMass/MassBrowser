import { warn } from '@utils/log'
import { store } from '@utils/store'
import config from '@utils/config'
import { isPlatform, OSX } from '@utils'
import AutoLaunch from 'auto-launch'


class AutoLauncher {
  constructor() {
  }

  createLauncher() {
    if (isPlatform(OSX)) {
      return new AutoLaunch({
        name: config.appName,
        path: `/Applications/${config.appName}.app`,
        isHidden: true
      })
    } else {
      warn('Auto launcher is currently only available for OSX')
      return null
    }
  }

  async initialize() {
    this.launcher = this.createLauncher()

    let enabledInStore = store.state.autoLaunchEnabled
    let enabled = await this.isEnabled()
    if (enabled && !enabledInStore) {
      this.disable()
    } else if (!enabled && enabledInStore) {
      this.enable()
    }
  }

  async enable() {
    if (!this.launcher) {
      return
    }

    await this.launcher.enable()
    await store.commit('setAutoLauncher', true)
  }
  
  async disable() {
    if (!this.launcher) {
      return
    }
    await this.launcher.disable()
    await store.commit('setAutoLauncher', false)
  }

  async isEnabled() {
    if (!this.launcher) {
      return false
    }
    return await this.launcher.isEnabled()
  }
}

export const autoLauncher = new AutoLauncher()
export default autoLauncher
