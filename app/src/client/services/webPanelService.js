import connect from 'connect'
import http from 'http'
import serveStatic from 'serve-static'
import path from 'path'
import fs from 'fs-extra'

import { debug, warn, error } from '@utils/log'
import { AutoUpdateError } from '@utils/errors'
import config from '@utils/config'
import { getDataDir } from '@utils'
import { store } from '@utils/store'

class WebPanelService {
  constructor () {
    this.app = connect()
    this.server = null

    if (config.isElectronMainProcess) {
      this.initializeApp(this.app)
    }
  }

  start() {
    let port = config.web.port
    this.server = http.createServer(this.app)
    this.server.listen(port, () => debug(`Web panel server started on port ${port}`))
  }

  initializeApp(app) {
    app.use('/check-proxy', function (req, res) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'text/plain')
      res.end('active')
    })

    app.use('/plugin', function (req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'application/x-xpinstall')
      fs.readFile(path.join(getDataDir(), 'massbrowser_manager-0.1.0-fx.xpi'))
      .then(f => {
        console.log(f)
        res.end(f)
        next()
      })
    })

    app.use('/cert', function (req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'application/x-x509-ca-cert')
      fs.readFile(path.join(getDataDir(), 'certs/ca.pem'))
        .then(f => {
          console.log(f)
          res.end(f)
          next()
        })
    })

    app.use('/settings-complete', function (req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.end('ok')
      store.commit('completeBrowserIntegration')
    })

    const electron = require('electron')
    /* TODO: hadi: I don't like this */
    /* Needs to change for console mode */
    if (config.isProduction) {
      app.use(serveStatic(`${electron.app.getAppPath()}/dist/web`))
    } else {
      app.use(serveStatic(`./app/dist/web`))
    }
  }
}

export const webPanelService = new WebPanelService()
export default webPanelService
