import { initializeMainProcess } from '@common/main/electron/main'
import { remote } from '@utils/remote'
import { debug } from '@utils/log'
import { syncService, relayManager, networkMonitor } from '@/services'
import { statusManager, autoUpdater } from '@common/services'
import bootRelay from '@/boot'


// const serviceRegistry = new ServiceRegistry()
remote.registerService('sync', syncService)
remote.registerService('status', statusManager)
remote.registerService('relay', relayManager)
remote.registerService('network-monitor', networkMonitor)
remote.registerService('boot', { boot: bootRelay })
remote.registerService('autoupdate', autoUpdater)

// var requireControllerFilter = require.context('@/controllers', true, /\.js$/)
// requireControllerFilter.keys().forEach(requireControllerFilter)

let currentWindow = null

function onWindowCreated(window) {
  debug("Window created")
  remote.setWebContents(window.webContents)
  currentWindow = window
}

function onWindowClosed() {
  currentWindow = null
  remote.setWebContents(null)
}

initializeMainProcess(onWindowCreated, onWindowClosed)