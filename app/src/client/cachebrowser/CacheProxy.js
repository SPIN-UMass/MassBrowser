/**
 * Created by milad on 5/29/17.
 */
let tls = require('tls')
let dns = require('dns')
let fs = require('fs')
import CertificateManager from './CertManager'
import config from '~/utils/config'

class _CacheProxy {

  constructor () {
    this.proxyserver = undefined
    this.connectionlist = {}
    this.proxyoptions = {
      SNICallback: function (domain, cb) {
        CertificateManager.getServerCerts(domain).then((data) => {
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
      this.proxyserver = tls.createServer(this.proxyoptions, (socket) => {
        console.log('new Connection')
        this.handleCacheSocket(socket)
      })

      this.proxyserver.listen(config.cachebrowser.mitmPort, () => {
        CertificateManager.initializeCA().then(() => {
          resolve()
        })
      })
    })
  }

  resovleURL (addr) {
    return new Promise((resolve, reject) => {
      dns.lookup(addr, (err, address, family) => {
        if (err) { reject(err) } else { resolve([address, 'www.test.com']) }
      })
    })
  }

  registerConnection (clientport, addr, port, proxyReady) {
    this.connectionlist[clientport] = [addr, port]
    this.resovleURL(addr).then((data) => {
      this.connectionlist[clientport] = [data[0], port, data[1]]
      proxyReady()
    })
  }

  handleCacheSocket (socket) {
    console.log('I am creating connection', this.connectionlist)

    let cachesocketoptions = {
      host: this.connectionlist[socket.remotePort][0],
      port: this.connectionlist[socket.remotePort][1],
      servername: this.connectionlist[socket.remotePort][2],
      rejectUnauthorized: false
    }
    console.log(this.connectionlist)
    delete this.connectionlist[socket.remotePort]

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

      proxysocket.on('error', (err) => {
        console.log('error2', err)
      })
    })

    socket.on('data', (d) => {
      proxysocket.write(d)
    })
    socket.on('error', (err) => {
      console.log('erroring', err, 'end of error', proxysocket.destroyed)
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

var CacheProxy = new _CacheProxy()
export default CacheProxy
