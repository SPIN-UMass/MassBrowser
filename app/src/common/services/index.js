import config from '@utils/config'

module.exports = {
    ...require('./autoUpdater'),
    ...require('./statusManager'),
    ...require('./SyncService'),
    ...require('./torService'),
    ...require('./telegramService'),
    ...require('./privacyPolicy'),
    // add them?
    ...require('./commonRelayManager'),
    ...require('./networkMonitor'),
    // after adding this, I don't get an exception anymore although I use console instead of GUI
    // no idea why it's used without electron config check. Maybe a bug?
    ...require('./autoLauncher'),
    ...(config.isElectronProcess ? require('./feedbackService') : {}),
    ...(config.isElectronProcess ? require('./autoLauncher') : {}),
    ...(config.isElectronProcess ? require('./dockHider') : {})
}
