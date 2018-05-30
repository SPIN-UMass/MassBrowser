import config from '@utils/config'

module.exports = {
    ...require('./autoUpdater'),
    ...require('./statusManager'),
    ...require('./SyncService'),
    ...require('./torService'),
    ...require('./telegramService'),
    ...(config.isElectronProcess ? require('./feedbackService') : {}),
    ...(config.isElectronProcess ? require('./autoLauncher') : {}),
    ...(config.isElectronProcess ? require('./dockHider') : {})
}
