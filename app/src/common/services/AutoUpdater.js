import { EventEmitter } from 'events'
import { autoUpdater } from 'electron-updater'
import { CancellationToken, HttpError, HttpExecutor, RequestOptionsEx } from "electron-builder-http"
import { GithubOptions, githubUrl } from "electron-builder-http/out/publishOptions"
import { UpdateInfo } from "electron-builder-http/out/updateInfo"
import { RequestOptions } from "http"
import { safeLoad } from "js-yaml"
import * as path from "path"
import { parse as parseUrl } from "url"
import { AppUpdater } from "electron-updater/out/AppUpdater"
import { FileInfo, formatUrl, getChannelFilename, getDefaultChannelName, isUseOldMacProvider, Provider } from "electron-updater/out/main"

import { AutoUpdateError } from '~/utils/errors'
import Status from '@common/services/StatusService'
import { warn, info } from '@utils/log'
import { prettyBytes } from '~/utils'
import config from '@utils/config'
import { isPlatform, WINDOWS, OSX, LINUX } from '@utils'

if (config.isProduction) {
  autoUpdater.autoDownload = false
  autoUpdater.allowPrerelease = false
  autoUpdater.loadUpdateConfig().then(options => {
    autoUpdater.clientPromise = new Promise((r, _) => r(new GitHubProvider(options, autoUpdater, autoUpdater.httpExecutor)))
  })
}

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
        progress => progress === 100 
          ? 'Finalizing update...' 
          :`Downloading update ${progress}% (${prettyBytes(downloadSpeed)}/s)`,
        100
      )

      const onProgress = (info) => {
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

function getChannelName() {
  if (isPlatform(OSX)) {
    return `${config.appName}-mac`
  } else {
    return `${config.appName}`
  }
}

function validateUpdateInfo(info) {
  if (isUseOldMacProvider()) {
    if ((info).url == null) {
      throw new Error("Update info doesn't contain url")
    }
    return
  }

  if (info.sha2 == null && info.sha512 == null) {
    throw new Error(`Update info doesn't contain sha2 or sha512 checksum: ${JSON.stringify(info, null, 2)}`)
  }
  if (info.path == null) {
    throw new Error(`Update info doesn't contain file path: ${JSON.stringify(info, null, 2)}`)
  }
}

export class BaseGitHubProvider  {
  constructor(options, baseHost) {
    this.baseHost = baseHost
    this.options = options
    this.requestHeaders = {}

    const baseUrl = parseUrl(`${options.protocol || "https"}://${options.host || baseHost}`)
    this.baseUrl = {
      protocol: baseUrl.protocol,
      hostname: baseUrl.hostname,
      port: baseUrl.port,
    }
  }

  setRequestHeaders(value) {
    this.requestHeaders = value
  }
}

export class GitHubProvider extends BaseGitHubProvider {
  constructor(options, updater, executor) {
    super(options, "github.com")
    this.updater = updater
    this.executor = executor
  }

  async getLatestVersion() {
    const basePath = this.basePath
    const cancellationToken = new CancellationToken()

    let releases = await this.executor.request({
      path: `/repos${basePath}`,
      headers: Object.assign(this.requestHeaders, {Accept: "application/json"}),
      protocol: this.baseUrl.protocol,
      port: this.baseUrl.port,
      hostname: 'api.github.com'
    }, cancellationToken)

    if (typeof releases === 'string') {
      releases = JSON.parse(releases)
    }

    const channel = getChannelName()
    const channelFile = `${channel}.yml`
    
    let releaseFile = null
    let release = releases.find(r => {
      if (!r.assets) {
        return false
      }

      releaseFile = r.assets.find(a => a.name === channelFile)
      return !!releaseFile
    })

    if (!release) {
      throw new Error(`No published versions on GitHub`)
    }

    const requestOptions = Object.assign({
      path: this.getBaseDownloadPath(release.tag_name, channelFile),
      headers: this.requestHeaders || undefined
    }, this.baseUrl)

    let rawData = null
    try {
      rawData = (await this.executor.request(requestOptions, cancellationToken))
    }
    catch (e) {
      if (!this.updater.allowPrerelease) {
        if (e instanceof HttpError && e.response.statusCode === 404) {
          throw new Error(`Cannot find ${channelFile} in the latest release artifacts (${formatUrl(requestOptions)}): ${e.stack || e.message}`)
        }
      }
      throw e
    }

    let result = null
    try {
      result = safeLoad(rawData)
    }
    catch (e) {
      throw new Error(`Cannot parse update info from ${channelFile} in the latest release artifacts (${formatUrl(requestOptions)}): ${e.stack || e.message}, rawData: ${rawData}`)
    }

    validateUpdateInfo(result)

    if (isUseOldMacProvider()) {
      result.releaseJsonUrl = `${githubUrl(this.options)}/${requestOptions.path}`
    }

    if (result.releaseName == null) {
      result.releaseName = release.name
    }
    if (result.releaseNotes == null) {
      result.releaseNotes = release.body
    }

    return result
  }

  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`
  }

  async getUpdateFile(versionInfo) {
    if (isUseOldMacProvider()) {
      return versionInfo
    }

    // space is not supported on GitHub
    // const name = versionInfo.githubArtifactName || path.posix.basename(versionInfo.path).replace(/ /g, "-")
    const name = versionInfo.path || path.posix.basename(versionInfo.path).replace(/ /g, "-")
    return {
      name,
      url: formatUrl(Object.assign({path: this.getBaseDownloadPath(`v${versionInfo.version}`, name)}, this.baseUrl)),
      sha2: versionInfo.sha2,
      sha512: versionInfo.sha512,
    }
  }

  getBaseDownloadPath(version, fileName) {
    return `${this.basePath}/download/${version}/${fileName}`
  }
}

const AutoUpdater = new _AutoUpdater()
export default AutoUpdater
