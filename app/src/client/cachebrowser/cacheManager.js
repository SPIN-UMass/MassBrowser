import crypto from 'crypto'
import { cacheProxy } from './cacheProxy'
import config from '@utils/config'
var net = require('net')

import { NotCacheBrowsableError } from '@utils/errors'

class CacheManager {
  interceptConnection (socket, dst, dstport, onConnect) {
    let proxy = net.createConnection({port: config.cachebrowser.mitmPort, host: 'localhost'})
    proxy.on('connect', () => {
      cacheProxy.registerConnection(proxy.localPort, dst, dstport, onConnect)
    })

    proxy.on('data', (d) => {
      try {
        if (!socket.write(d)) {
          proxy.pause()

          socket.on('drain', function () {
            proxy.resume()
          })
          setTimeout(function () {
            proxy.resume()
          }, 100)
        }
      } catch (err) {
      }
    })

    socket.on('data', function (d) {
      // If the application tries to send data before the proxy is ready, then that is it's own problem.
      try {
        if (!proxy.write(d)) {
          socket.pause()

          proxy.on('drain', function () {
            socket.resume()
          })
          setTimeout(function () {
            socket.resume()
          }, 100)
        }
      } catch (err) {
      }
    })
    
    socket.on('error', (err) => {
      console.log('error3', err)
      if (proxy.destroyed === false) {
        proxy.end()
      }
    })

    proxy.on('error', (err) => {
      console.log('error4', err)
      socket.end()
    })
    proxy.on('close', (had_error) => {
      try {
        socket.close()
      } catch (err) {
      }
    })
  }

  newCacheConnection (connection, dstip, dstport, onConnect) {
    return new Promise((resolve, reject) => {
      if (dstport !== 443) {
        return reject(new NotCacheBrowsableError("Domain is not cachebrowsable"))
      }

      this.interceptConnection(connection, dstip, dstport, onConnect)
      resolve('Intercepted')
    })
  }

}

export const cacheManager = new CacheManager()
export default cacheManager
