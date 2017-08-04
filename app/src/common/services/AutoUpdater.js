import { autoUpdater } from 'electron-updater'
import { warn, error } from '~/utils/log'
import { AutoUpdateError } from '~/utils/errors'
import { prettyBytes } from '~/utils'
import Status from '~/utils/status'
import config from '~/utils/config'
import { ipcRenderer } from 'electron'

class _AutoUpdater {
  constructor () {
    this.checkUpdatePromise = null
  }

  checkForUpdates() {
    return new Promise((resolve, reject) => {
      if (config.isDevelopment) {
        warn('Auto updater does not work in development mode')
        return resolve(false)
      }

      this.checkUpdatePromise = {resolve: resolve, reject: reject}

      ipcRenderer.once('autoupdate-update-available', () => resolve(true))
      ipcRenderer.once('autoupdate-update-not-available', () => resolve(false))
      ipcRenderer.once('autoupdate-error', (sender, err) => {
        reject(new AutoUpdateError(err))
      })

      ipcRenderer.send('autoupdate-check-for-update')
    }).then(result => {
      ipcRenderer.removeAllListeners('autoupdate-update-available')
      ipcRenderer.removeAllListeners('autoupdate-update-not-available')
      ipcRenderer.removeAllListeners('autoupdate-error')
      return result
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

      ipcRenderer.send('autoupdate-download-update')

      ipcRenderer.on('autoupdate-download-progress', (sender, info) => {
        progress.setProgress(Math.floor(info.percent))
        downloadSpeed = info.bytesPerSecond
      })

      ipcRenderer.once('autoupdate-error', (sender, err) => {
        reject(new AutoUpdateError(err))
      })

      ipcRenderer.on('autoupdate-update-downloaded', (sender, info) => {
        ipcRenderer.removeAllListeners('autoupdate-download-progress')
        ipcRenderer.removeAllListeners('autoupdate-update-downloaded')
        ipcRenderer.removeAllListeners('autoupdate-error')

        progress.finish()

        resolve()
      })
    })
  }

  quitAndInstall() {
    Status.info("Installing update...")
    ipcRenderer.send('autoupdate-install')
  }
}

var AutoUpdater = new _AutoUpdater()
export default AutoUpdater
