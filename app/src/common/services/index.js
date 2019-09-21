import config from '@utils/config'

export * from './autoUpdater'
export * from './statusManager'
export * from './SyncService'
export * from './torService'
export * from './telegramService'
export * from './privacyPolicy'
export * from './UDPConnectionService'

export let feedbackService = {}
export let autoLauncher = {}
export let dockHider = {}

if (config.isElectronProcess) {
  feedbackService = require('./feedbackService').feedbackService
  autoLauncher = require('./autoLauncher').autoLauncher
  dockHider = require('./dockHider').dockHider
}
