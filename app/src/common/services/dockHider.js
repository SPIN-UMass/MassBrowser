import { warn } from '@utils/log'
import { store } from '@utils/store'
import config from '@utils/config'
import { isPlatform, OSX } from '@utils'
import { app } from 'electron'

class DockHider {
  constructor() {
      this.initialize()
  }

  async initialize() {
    await store.state.ready
    let visible = store.state.dockIconVisible
    if (visible) {
      this.show()
    } else {
      this.hide()
    }
  }

  changeVisibility(visible) {
      return store.commit('changeDockIconVisible', visible)
  }

  async show() {
    if (isPlatform(OSX)) {
        app.dock.show();
    } else {
        warn("Hiding dock icon only supported in OSX")
    }
  }
  
  async hide() {
    if (isPlatform(OSX)) {
        app.dock.hide();
    } else {
        warn("Hiding dock icon only supported in OSX")
    }
  }

  async windowOpened() {
    return this.show()
  }

  async windowClosed() {
    let visible = store.state.dockIconVisible
    if (!visible) {
      this.hide()
    }
  }  
}

export const dockHider = new DockHider()
export default dockHider
