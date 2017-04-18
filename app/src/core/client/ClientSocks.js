/**
 * Created by milad on 4/12/17.
 */
var net = require('net'),
  socks = require('./socks.js'),
  info = console.log.bind(console)
import ConnectionManager from './ConnectionManager'

// Create server
// The server accepts SOCKS connections. This particular server acts as a proxy.

export function startClientSocks (mhost, mport) {
  var HOST = mhost,
    PORT = mport
  if (typeof mhost === 'undefined') {
    HOST = '127.0.0.1'
  }
  if (typeof mport === 'undefined') {
    PORT = '7080'
  }

  function onConnection(socket, port, address, proxy_ready) {
    // Implement your own proxy here! Do encryption, tunnelling, whatever! Go flippin' mental!
    // I plan to tunnel everything including SSH over an HTTP tunnel. For now, though, here is the plain proxy:
    ConnectionManager.newClientConnection(socket, port, address)
    proxy_ready()
  }

  return new Promise((resolve, reject) => {
    var userPass = undefined//process.argv[3] && process.argv[4] && {username: process.argv[3], password: process.argv[4]}
    var server = socks.createServer(onConnection, userPass, server => {  
      resolve(server)
    })

    server.on('error', function (e) {
      console.error('SERVER ERROR: %j', e)
      if (e.code == 'EADDRINUSE') {
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
