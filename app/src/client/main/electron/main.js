import { initializeMainProcess } from '@common/main/electron/main'
import { registerController, serviceRegistry } from '@utils/remote'
import { debug } from '@utils/log'

import SyncService from '@/services/SyncService'
import StatusService from '@common/services/StatusService'
import RegistrationService from '@/services/RegistrationService'
import Context from '@/context'

import bootClient from '@/boot'

serviceRegistry.registerService('sync', SyncService)
serviceRegistry.registerService('status', StatusService)
serviceRegistry.registerService('context', Context)
serviceRegistry.registerService('registration', RegistrationService)
serviceRegistry.registerService('boot', { bootClient })

var requireControllerFilter = require.context('@/controllers', true, /\.js$/)
requireControllerFilter.keys().forEach(requireControllerFilter)


let currentWindow = null

function onWindowCreated(window) {
  debug("Window created")
  serviceRegistry.setWebContents(window.webContents)
  currentWindow = window
}

function onWindowClosed() {
  currentWindow = null
  serviceRegistry.setWebContents(null)
}

initializeMainProcess(onWindowCreated, onWindowClosed)