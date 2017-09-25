import { initializeMainProcess } from '@common/main/electron/main'
import { remote } from '@utils/remote'
import { debug } from '@utils/log'

import { statusManager } from '@common/services/statusManager'
import { autoUpdater } from '@common/services/autoUpdater'
import { syncService, registrationService } from '@/services'
import KVStore from '@utils/kvstore'
import { store } from '@utils/store' // required for boot, don't remove
import bootClient from '@/boot'

import models from '@/models' // required for bootstrapping remote models

remote.registerService('sync', syncService)
remote.registerService('status', statusManager)
remote.registerService('registration', registrationService)
remote.registerService('boot', { boot: bootClient })
remote.registerService('autoupdate', autoUpdater)
remote.registerService('kvstore', KVStore)


// let requireControllerFilter = require.context('@/controllers', true, /\.js$/)
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
