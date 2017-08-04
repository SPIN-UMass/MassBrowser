import { CancellationToken, HttpError, HttpExecutor, RequestOptionsEx } from "electron-builder-http"
import { GithubOptions, githubUrl } from "electron-builder-http/out/publishOptions"
import { UpdateInfo } from "electron-builder-http/out/updateInfo"
import { RequestOptions } from "http"
import { safeLoad } from "js-yaml"
import * as path from "path"
import { parse as parseUrl } from "url"
import { AppUpdater } from "electron-updater/out/AppUpdater"
import { FileInfo, formatUrl, getChannelFilename, getDefaultChannelName, isUseOldMacProvider, Provider } from "electron-updater/out/main"


require("babel-polyfill");

function getChannelName() {
  return 'latest'  // TODO
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
    const name = versionInfo.githubArtifactName || path.posix.basename(versionInfo.path).replace(/ /g, "-")
    return {
      name,
      url: formatUrl(Object.assign({path: this.getBaseDownloadPath(versionInfo.version, name)}, this.baseUrl)),
      sha2: versionInfo.sha2,
      sha512: versionInfo.sha512,
    }
  }

  getBaseDownloadPath(version, fileName) {
    return `${this.basePath}/download/${version}/${fileName}`
  }
}