import config from '@utils/config'

export * from './autoUpdater'
export * from './statusManager'
export * from './torService'
export * from './SyncService'
export * from './telegramService'
export * from './privacyPolicy'
export * from './UDPConnectionService'
export * from  './feedbackService'
export * from  './dockHider'
export * from  './autoLauncher'



// module.exports = {
//     ...require('./autoUpdater'),
//     ...require('./statusManager'),
//     ...require('./SyncService'),
//     ...require('./torService'),
//     ...require('./telegramService'),
//     ...require('./privacyPolicy'),
//     ...require('./UDPConnectionService'),
//     ...(config.isElectronProcess ? require('./feedbackService') : {}),
//     ...(config.isElectronProcess ? require('./autoLauncher') : {}),
//     ...(config.isElectronProcess ? require('./dockHider') : {})
// }
