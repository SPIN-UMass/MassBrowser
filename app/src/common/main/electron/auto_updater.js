import { autoUpdater } from 'electron-updater'
import { CancellationToken } from 'electron-builder-http'
import { ipcMain } from 'electron'
import { GitHubProvider } from './github'

export function initAutoUpdater(remote) {
  // autoUpdater.autoDownload = false
  // autoUpdater.allowPrerelease = false
  // autoUpdater.loadUpdateConfig().then(options => {
  //   autoUpdater.clientPromise = new Promise((r, _) => r(new GitHubProvider(options, autoUpdater, autoUpdater.httpExecutor)))
  // })
  
  // let downloadCancelationToken = null

  // autoUpdater.on('checking-for-update', () => {
  //   remote.send('autoupdate-checking-for-update')
  // })

  // autoUpdater.on('update-available', (info) => {
  //   remote.send('autoupdate-update-available', info)
  // })

  // autoUpdater.on('update-not-available', (info) => {
  //   remote.send('autoupdate-update-not-available', info)
  // })

  // autoUpdater.on('error', (err) => {
  //   remote.send('autoupdate-error', err)
  // })

  // autoUpdater.on('download-progress', (progressObj) => {
  //   remote.send('autoupdate-download-progress', progressObj)
  // })

  // autoUpdater.on('update-downloaded', (info) => {
  //   remote.send('autoupdate-update-downloaded', info)
  // })

  // /* ----- API provided to renderer ----- */

  // ipcMain.on('autoupdate-check-for-update', () => {
  //   autoUpdater.checkForUpdates()
  // })

  // ipcMain.on('autoupdate-download-update', () => {
  //   downloadCancelationToken = new CancellationToken()
  //   autoUpdater.downloadUpdate(downloadCancelationToken)
  // })

  // ipcMain.on('autoupdate-install', () => {
  //   autoUpdater.quitAndInstall()
  // })
}
