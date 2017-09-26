import { warn } from '@utils/log'
import { store } from '@utils/store'
import config from '@utils/config'
import { isPlatform, OSX } from '@utils'
import AutoLaunch from 'auto-launch'


class AutoLauncher {
  constructor() {
    this.launcher = this.createLauncher()
  }

  createLauncher() {
    if (isPlatform(OSX)) {
      return new AutoLaunch({
        name: config.appName,
        path: `/Applications/${config.appName}.app`,
      })
    } else {
      warn('Auto launcher is currently only available for OSX')
      return null
    }
  }

  async initialize() {
    if (!this.launcher) {
      return
    }

    let enabledInStore = store.state.autoLaunchEnabled

    let enabled = await this.isEnabled()
    if (enabled && !enabledInStore) {
      this.disable()
    } else if (!enabled && enabledInStore) {
      this.enable()
    }
  }

  enable() {
    if (!this.launcher) {
      return
    }
    this.launcher.enable()
    store.commit('setAutoLauncher', true)
  }
  
  disable() {
    if (!this.launcher) {
      return
    }
    this.launcher.disable()
    store.commit('setAutoLauncher', false)
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
