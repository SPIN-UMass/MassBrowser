/**
 * Created by milad on 4/21/17.
 */
/**
 * Created by milad on 4/12/17.
 */
var net = require('net'),
  socks = require('./socks.js'),
  info = console.log.bind(console)
import ConnectionManager from './ConnectionManager'
import CacheManager from '~/client/cachebrowser/CacheManager'
import PolicyManager from '~/client/services/PolicyManager'
// Create server
// The relay accepts SOCKS connections. This particular relay acts as a proxy.

export function startClientSocks (mhost, mport) {
  var HOST = mhost,
    PORT = mport
  if (typeof mhost === 'undefined') {
    HOST = '127.0.0.1'
  }
  if (typeof mport === 'undefined') {
    PORT = '7080'
  }

  function onConnection (socket, port, address, proxyReady) {
    // Implement your own proxy here! Do encryption, tunnelling, whatever! Go flippin' mental!
    // I plan to tunnel everything including SSH over an HTTP tunnel. For now, though, here is the plain proxy:
    PolicyManager.getDomainPolicy(address, port).then((proxyType) => {
      if (proxyType === PolicyManager.POLICY_YALER_PROXY) {
        ConnectionManager.newClientConnection(socket, address, port, proxyReady).then(() => {}, (error) => {
          regularProxy(socket, port, address, proxyReady)
        })
      } else if (proxyType === PolicyManager.POLICY_CACHEBROWSE) {
        CacheManager.newCacheConnection(socket, address, port, proxyReady).then(() => {}, (error) => {
          regularProxy(socket, port, address, proxyReady)
        })
      } else {
        regularProxy(socket, port, address, proxyReady)
      }
    })
  }

  function regularProxy (socket, port, address, proxyReady) {
    var proxy = net.createConnection({port: port, host: address}, proxyReady)
    var localAddress, localPort
    proxy.on('connect', () => {
      localPort = proxy.localPort
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
        // console.log('sending ' + d.length + ' bytes to proxy');
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

    proxy.on('error', function (err) {
      // console.log('Ignore proxy error');
    })
    socket.on('error', (err) => {

    })

    proxy.on('close', function (had_error) {
      try {
        if (localAddress && localPort) { console.log('The proxy %s:%d closed', localAddress, localPort) } else { console.error('Connect to %s:%d failed', address, port) }
        socket.close()
      } catch (err) {
      }
    })
  }

  return new Promise((resolve, reject) => {
    var userPass// process.argv[3] && process.argv[4] && {username: process.argv[3], password: process.argv[4]}
    var server = socks.createServer(onConnection, userPass, server => {
      resolve(server)
    })

    server.on('error', function (e) {
      console.error('SERVER ERROR: %j', e)
      if (e.code === 'EADDRINUSE') {
        console.log('Address in use, retrying in 10 seconds...')
        setTimeout(function () {
          console.log('Reconnecting to %s:%s', HOST, PORT)
          server.close()
          server.listen(PORT, HOST)
        }, 10000)
      }
    })

    server.listen(PORT, HOST)
  })
}
