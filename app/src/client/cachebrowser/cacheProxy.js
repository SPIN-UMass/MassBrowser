/**
 * Created by milad on 5/29/17.
 */
import tls from 'tls'
import dns from 'dns'
import fs from 'fs'

import { certificateManager } from './certManager'
import config from '@utils/config'
import { debug, info, warn } from '@utils/log'
import { CacheBrowserError } from '@utils/errors'
import API from '@/api'

class CacheProxy {

  constructor () {
    this.proxyserver = undefined
    this.connectionlist = {}
    this.proxyoptions = {
      SNICallback: function (domain, cb) {
        certificateManager.getServerCerts(domain).then((data) => {
          return cb(null, tls.createSecureContext(data))
        })
      },
      requestCert: false,
      // key: fs.readFileSync('./ia.key'),
      // cert: fs.readFileSync('./ia.crt'),
      rejectUnauthorized: false

    }
  }

  startCacheProxy () {
    return new Promise((resolve, reject) => {
      if (this.proxyserver) {
        warn("Cachebrowser proxy server already running")
        resolve()
      }

      let started = false

      this.proxyserver = tls.createServer(this.proxyoptions, (socket) => {
        // console.log('new Connection')
        this.handleCacheSocket(socket)
      })

      this.proxyserver.listen(config.cachebrowser.mitmPort, () => {
        started = true
        debug('Initializing certificate manager')
        certificateManager.initializeCA().then(() => {
          resolve()
        })
      })

      this.proxyserver.on('error', e => {
        if (!started) {
          reject(new CacheBrowserError("Could not start CacheBrowser proxy server"))
        } else {
          console.error(e)
        }
      })
    })
  }

  resolveURL (addr) {
    return new Promise((resolve, reject) => {
      API.resolveURL(addr).then((r)=>{
        if (r){
          resolve([r,"www.test.com"])
        }
        reject("URL NOT FOUND")

      },(err)=>{
        reject(err)
      })
    })
  }

  registerConnection (clientport, addr, port, proxyReady) {
    this.connectionlist[clientport] = [addr, port]
    this.resolveURL(addr).then((data) => {
      this.connectionlist[clientport] = [data[0], port, data[1]]
      proxyReady()
    })
  }

  handleCacheSocket (socket) {
    // console.log('I am creating connection', this.connectionlist)

    let cachesocketoptions = {
      host: this.connectionlist[socket.remotePort][0],
      port: this.connectionlist[socket.remotePort][1],
      servername: this.connectionlist[socket.remotePort][2],
      rejectUnauthorized: false
    }
    // console.log(this.connectionlist)
    delete this.connectionlist[socket.remotePort]

    // Note that tls.connect is a modified wrapper function around
    // what is used in the standard tls library. It is the core of
    // domain-fronting technique but it is queit simple: the modified
    // function will remove the servername field from the
    // cachesocketoptions before performing a standard tls.connect so
    // that the sensitive servername which was in the cleartext form
    // in the TLS handshake will not be observed by the censor any
    // more. The modified tls.connect we used is from
    // /app/src/client/main/console.js
    let proxysocket = tls.connect(cachesocketoptions, () => {
      proxysocket.on('data', (d) => {
        socket.write(d)
      })

      proxysocket.on('end', () => {
        if (!socket.destroyed) {
          socket.end()
        }
      })

      proxysocket.on('close', () => {
        if (!socket.destroyed) {
          socket.end()
        }
      })
    })

    proxysocket.on('error', (err) => {
      warn(`Cachebrowser proxy connection errored ${err.code || ''}`)
    })

    socket.on('data', (d) => {
      proxysocket.write(d)
    })

    socket.on('error', (err) => {
      warn(`Cachebrowser browser connection errored ${err.code || ''}`)
      socket.end()
      proxysocket.end()
    })

    socket.on('end', () => {
      proxysocket.end()
    })

    socket.on('close', () => {
      proxysocket.end()
    })
  }
}

export const cacheProxy = new CacheProxy()
export default cacheProxy
