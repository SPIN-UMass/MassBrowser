import { initializeMainProcess } from '@common/main/electron/main'
import { remote } from '@utils/remote'
import { debug } from '@utils/log'

import SyncService from '@/services/SyncService'
import StatusService from '@common/services/StatusService'
import AutoUpdater from '@common/services/AutoUpdater'
import RegistrationService from '@/services/RegistrationService'
import KVStore from '@utils/kvstore'
import { store } from '@utils/store' // required for boot
import bootClient from '@/boot'

remote.registerService('sync', SyncService)
remote.registerService('status', StatusService)
remote.registerService('registration', RegistrationService)
remote.registerService('boot', { bootClient })
remote.registerService('autoupdate', AutoUpdater)
remote.registerService('kvstore', KVStore)


var requireControllerFilter = require.context('@/controllers', true, /\.js$/)
requireControllerFilter.keys().forEach(requireControllerFilter)


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
