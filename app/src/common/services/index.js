import config from '@utils/config'

module.exports = {
    ...require('./autoUpdater'),
    ...require('./statusManager'),
    ...require('./SyncService'),
    ...(config.isElectronProcess ? require('./feedbackService') : {}),
    ...(config.isElectronProcess ? require('./autoLauncher') : {}),
    ...(config.isElectronProcess ? require('./dockHider') : {})
}