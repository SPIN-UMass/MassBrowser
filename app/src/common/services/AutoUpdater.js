import { EventEmitter } from 'events'
import { autoUpdater } from 'electron-updater'
import { CancellationToken } from 'electron-builder-http'

import { AutoUpdateError } from '~/utils/errors'
import Status from '@common/services/StatusService'
import config from '@utils/config'
import { warn, info } from '@utils/log'
import { GitHubProvider } from './github'


autoUpdater.autoDownload = false
autoUpdater.allowPrerelease = false
autoUpdater.loadUpdateConfig().then(options => {
  autoUpdater.clientPromise = new Promise((r, _) => r(new GitHubProvider(options, autoUpdater, autoUpdater.httpExecutor)))
})

class _AutoUpdater extends EventEmitter {
  checkForUpdates() {
  
    return new Promise((resolve, reject) => {
      if (config.isDevelopment) {
        warn('Auto updater does not work in development mode')
        return resolve(false)
      }
      info("Checking for updates")
      const onUpdateAvailable = () => {
        clearListeners()
        resolve(true)
      }
  
      const onUpdateNotAvailable = () => {
        clearListeners()
        resolve(false)
      }
      
      const onError = (err) => {
        clearListeners()
        reject(new AutoUpdaterError(err))
      }

      const clearListeners = () => {
        autoUpdater.removeListener('update-available', onUpdateAvailable)
        autoUpdater.removeListener('update-not-available', onUpdateNotAvailable)
        autoUpdater.removeListener('error', onError)
      }
  
      autoUpdater.on('update-available', onUpdateAvailable)
      autoUpdater.on('update-not-available', onUpdateNotAvailable)
      autoUpdater.on('error', onError)

      autoUpdater.checkForUpdates()
    })
  }

  downloadUpdate() {
    return new Promise((resolve, reject) => {
      let downloadSpeed = 0
      let progress = Status.progress(
        'update-progress',
        progress => `Downloading update ${progress}% (${prettyBytes(downloadSpeed)}/s)`,
        100
      )

      const onProgress = (progressObj) => {
        progress.setProgress(Math.floor(info.percent))
        downloadSpeed = info.bytesPerSecond
      }

      const onFinish = () => {
        clearListeners()
        progress.finish()
        resolve()
      }

      const onError = (err) => {
        clearListeners()
        reject(new AutoUpdateError(err))
      }
      
      const clearListeners = () => {
        autoUpdater.removeListener('download-progress', onProgress)
        autoUpdater.removeListener('update-downloaded', onFinish)
        autoUpdater.removeListener('error', onError)
      }


      autoUpdater.on('download-progress', onProgress)
      autoUpdater.on('update-downloaded', onFinish)
      autoUpdater.on('error', onError)

      let downloadCancelationToken = new CancellationToken()
      autoUpdater.downloadUpdate(downloadCancelationToken)
    })
  }
   
  quitAndInstall() {
    Status.info("Installing update...")
    autoUpdater.quitAndInstall()
  }
}

const AutoUpdater = new _AutoUpdater()
export default AutoUpdater
