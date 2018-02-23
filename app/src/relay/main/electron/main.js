import { initializeMainProcess } from '@common/main/electron/main'
import { remote } from '@utils/remote'
import { debug } from '@utils/log'
import { syncService, relayManager, networkMonitor, registrationService, feedbackService } from '@/services'
import { statusManager, autoUpdater, autoLauncher, dockHider } from '@common/services'
import bootRelay from '@/boot'
import { store } from '@utils/store'

// const serviceRegistry = new ServiceRegistry()
remote.registerService('sync', syncService)
remote.registerService('status', statusManager)
remote.registerService('relay', relayManager)
remote.registerService('network-monitor', networkMonitor)
remote.registerService('boot', { boot: bootRelay })
remote.registerService('autoupdate', autoUpdater)
remote.registerService('registration', registrationService)
remote.registerService('autoLaunch', autoLauncher)
remote.registerService('dockHider', dockHider)
remote.registerService('feedback', feedbackService)


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

process.on('uncaughtException', (e) => {
  console.error(e)
})

initializeMainProcess(onWindowCreated, onWindowClosed)