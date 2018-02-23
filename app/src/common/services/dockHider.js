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

  async show() {
    if (isPlatform(OSX)) {
        app.dock.show();
    } else {
        warn("Hiding dock icon only supported in OSX")
    }
    await store.commit('changeDockIconVisible', true)
  }
  
  async hide() {
    if (isPlatform(OSX)) {
        app.dock.hide();
    } else {
        warn("Hiding dock icon only supported in OSX")
    }
    
    await store.commit('changeDockIconVisible', false)
  }
}

export const dockHider = new DockHider()
export default dockHider
