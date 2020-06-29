import { EventEmitter } from 'events'
import { autoUpdater as eAutoUpdater } from 'electron-updater'
import { CancellationToken, HttpError, HttpExecutor, RequestOptionsEx } from "electron-builder-http"
import { GithubOptions, githubUrl } from "electron-builder-http/out/publishOptions"
import { UpdateInfo } from "electron-builder-http/out/updateInfo"
import { RequestOptions } from "http"
import { safeLoad } from "js-yaml"
import * as path from "path"
import { parse as parseUrl } from "url"
import { FileInfo, newUrlFromBase, getChannelFilename, getDefaultChannelName, Provider } from "electron-updater/out/main"
import {URL} from 'url'
import { AutoUpdateError } from '~/utils/errors'
import { statusManager } from '@common/services/statusManager'
import { warn, info } from '@utils/log'
import { prettyBytes } from '~/utils'
import config from '@utils/config'
import { isPlatform, WINDOWS, OSX, LINUX } from '@utils'

if (config.isProduction) {
  eAutoUpdater.autoDownload = false
  eAutoUpdater.allowPrerelease = false
  eAutoUpdater.loadUpdateConfig().then(options => {
    eAutoUpdater.clientPromise = new Promise((r, _) => r(new GitHubProvider(options, eAutoUpdater, eAutoUpdater.httpExecutor)))
  })
}

function _Provider() {
  const data = Provider

  _Provider = function () {
    return data
  }

  return data
}


class AutoUpdater extends EventEmitter {
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
        reject(new AutoUpdateError(err))
      }

      const clearListeners = () => {
        eAutoUpdater.removeListener('update-available', onUpdateAvailable)
        eAutoUpdater.removeListener('update-not-available', onUpdateNotAvailable)
        eAutoUpdater.removeListener('error', onError)
      }
  
      eAutoUpdater.on('update-available', onUpdateAvailable)
      eAutoUpdater.on('update-not-available', onUpdateNotAvailable)
      eAutoUpdater.on('error', onError)

      eAutoUpdater.checkForUpdates()
    })
  }

  downloadUpdate() {
    return new Promise((resolve, reject) => {
      let downloadSpeed = 0
      let progress = statusManager.progress(
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
        eAutoUpdater.removeListener('download-progress', onProgress)
        eAutoUpdater.removeListener('update-downloaded', onFinish)
        eAutoUpdater.removeListener('error', onError)
      }


      eAutoUpdater.on('download-progress', onProgress)
      eAutoUpdater.on('update-downloaded', onFinish)
      eAutoUpdater.on('error', onError)

      let downloadCancelationToken = new CancellationToken()
      eAutoUpdater.downloadUpdate(downloadCancelationToken)
    })
  }
   
  quitAndInstall() {
    statusManager.info("Installing update...")
    eAutoUpdater.quitAndInstall()
  }
}

function getChannelName() {
  console.log('My rule is', config.role,config.is)
  if (config.isFirefoxVersion){

  
  if (isPlatform(OSX)) {
    return `${config.role}Firefox-mac`
  } else {
    return `${config.role}Firefox`
  }
  }
  else{
    if (isPlatform(OSX)) {
      return `${config.role}-mac`
    } else {
      return `${config.role}`
    }
  }
}

function validateUpdateInfo(info) {


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

    console.log(this.baseUrl,this.getBaseDownloadPath(release.tag_name, channelFile))
    const url = newUrlFromBase( this.getBaseDownloadPath(release.tag_name, channelFile), 'https://github.com')

    let rawData = null
    try {
      rawData = (await this.executor.request(requestOptions, cancellationToken))
    }
    catch (e) {
      if (!this.updater.allowPrerelease) {
        if (e instanceof HttpError && e.response.statusCode === 404) {
          throw new Error(`Cannot find ${channelFile} in the latest release artifacts (${url}): ${e.stack || e.message}`)
        }
      }
      throw e
    }

    let result = null
    try {
      result = safeLoad(rawData)
    }
    catch (e) {
      throw new Error(`Cannot parse update info from ${channelFile} in the latest release artifacts (${url}): ${e.stack || e.message}, rawData: ${rawData}`)
    }

    validateUpdateInfo(result)


    if (result.releaseName == null) {
      result.releaseName = release.name
    }
    if (result.releaseNotes == null) {
      result.releaseNotes = release.body
    }

    return result
  }
  mybasePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`
  }

  getFileList(versionInfo) {


    // space is not supported on GitHub
    // const name = versionInfo.githubArtifactName || path.posix.basename(versionInfo.path).replace(/ /g, "-")
    let name = versionInfo.path || path.posix.basename(versionInfo.path).replace(/ /g, "-")
    console.log(versionInfo)
    let _url = new URL( this.getBaseDownloadPath(`v${versionInfo.version}`, name), 'https://github.com')
    
    console.log(_url.toString().replace(/ /g, "-"))
    return [{
      name,
      url: _url.toString().replace(/ /g, "-"),
      sha2: versionInfo.sha2,
      sha512: versionInfo.sha512,
    }]
  }
  
  
  resolveFiles(updateInfo) {
    // still replace space to - due to backward compatibility
    let baseUrl = 'https://github.com'
    var files = this.getFileList(updateInfo)
    console.log(files)
    
    const result = files.map(fileInfo => {
      if (fileInfo.sha2 == null && fileInfo.sha512 == null) {
        throw (0, _builderUtilRuntime().newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, _builderUtilRuntime().safeStringifyJson)(fileInfo)}`, "ERR_UPDATER_NO_CHECKSUM");
      }
  
      return {
        url: newUrlFromBase(fileInfo.url, baseUrl),
        info: fileInfo
      };
    });
    console.log(result)
    const packages = updateInfo.packages;
    const packageInfo = packages == null ? null : packages[process.arch] || packages.ia32;
  
    if (packageInfo != null) {
      result[0].packageInfo = Object.assign({}, packageInfo, {
        path: newUrlFromBase(pathTransformer(packageInfo.path), baseUrl).href
      });
    }
  
    return result;


  }



  getBaseDownloadPath(version, fileName) {
    return `${this.basePath}/download/${version}/${fileName}`
  }
}

export const autoUpdater = new AutoUpdater()
export default autoUpdater
