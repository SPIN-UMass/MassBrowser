const net = require('net')
const socks = require('./socks.js')
var socksClient = require('socks5-client')

import { connectionManager } from './connectionManager'
import { cacheManager } from '@/cachebrowser'
import { policyManager, connectionStats } from '@/services'
import { debug, warn, error } from '@utils/log'
import * as errors from '@utils/errors'
import config from '@utils/config'
import { torService, telegramService } from '@common/services'

export function startClientSocks (mhost, mport,msport) {
  var HOST = mhost
  var PORT = mport
  var SECOND_PORT = msport

  if (typeof mhost === 'undefined') {
    HOST = '127.0.0.1'
  }

  if (typeof mport === 'undefined') {
    PORT = '7080'
  }

  if (typeof msport === 'undefined') {
    SECOND_PORT = '7081'
  }

  function onConnection (socket, port, address, proxyReady,defaultProxy = regularProxy) {
    connectionStats.localSocketConnected(socket, address, port)

    // Handle torService and telegramService via yalerProxy
    if (net.isIP(address)) {    // net.isIP() will return 0 or 4 or 6
      if (torService.isTorIP(address)  || telegramService.isTelegramIP(address))
      {
        return yalerProxy(socket,address,port,proxyReady)
      }
      return sendToNoHostHandler(socket, address, port, proxyReady)
    }

    if (address === config.web.domain || ((address === '127.0.0.1' || address === 'localhost') && port === config.web.port)) {
      return sendToWebPanel(socket, address, port, proxyReady)
    }

    policyManager.getDomainPolicy(address, port)
    .then((proxyType) => {
      debug(`New socks connection to ${address}:${port} using policy '${proxyType}'`)

      connectionStats.socketPolicyDecided(socket, proxyType)

      if (proxyType === policyManager.POLICY_YALER_PROXY) {
        return yalerProxy(socket, address, port, proxyReady)
      } else if (proxyType === policyManager.POLICY_CACHEBROWSE) {
        return cachebrowse(socket, address, port, proxyReady)
      } else if (proxyType === policyManager.POLICY_VANILLA_PROXY) {
        return defaultProxy(socket, address, port, proxyReady)
      } else {
        return defaultProxy(socket, address, port, proxyReady)
      }
    })
    .catch(err => {
      if (err instanceof errors.InvalidHostError) {
        error(err.message)
      } else if (err instanceof errors.NoRelayAvailableError) {
        warn('No relay was found for new session, terminating connection')
        socket.end()
      } else {
        warn("Connection failed")
        error(err)
      }
      /* TODO at least report errors which are not smart to sentry
       * (errors which are we are sure aren't handled) */
    })
  }


  function onSecondConnection (socket, port, address, proxyReady) {
    return onConnection(socket,port,address,proxyReady,torProxy)
  }

  return new Promise((resolve, reject) => {
    var userPass// process.argv[3] && process.argv[4] && {username: process.argv[3], password: process.argv[4]}
    var server = socks.createServer(onConnection, userPass, server => {
      resolve(server)
    })
    
    var second_server = socks.createServer(onSecondConnection, userPass, second_server => {
      resolve(second_server)
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



    second_server.on('error', function (e) {
      console.error('SERVER ERROR: %j', e)
      if (e.code === 'EADDRINUSE') {
        console.log('Address in use, retrying in 10 seconds...')
        setTimeout(function () {
          console.log('Reconnecting to %s:%s', HOST, SECOND_PORT)
          second_server.close()
          second_server.listen(SECOND_PORT, HOST)
        }, 10000)
      }
    })

    server.listen(PORT, HOST)
    second_server.listen(SECOND_PORT, HOST)
    
  })
}

function yalerProxy (socket, address, port, proxyReady) {
  return connectionManager.newClientConnection(socket, address, port, proxyReady)
}

function cachebrowse (socket, address, port, proxyReady) {
  return cacheManager.newCacheConnection(socket, address, port, proxyReady)
    .catch(err => {
      if (err instanceof errors.NotCacheBrowsableError) {
        warn(`Attempted to cachebrowse ${address}:${port} but it is not cachebrowsable, falling back to relay proxy`)
        return yalerProxy(socket, address, port, proxyReady)
      } else {
        throw err
      }
    })
}

function regularProxy (socket, address, port, proxyReady) {
  const proxy = net.createConnection({port: port, host: address}, proxyReady)
  let localAddress, localPort

  connectionStats.remoteSocketConnected(socket, proxy)

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
    try {
      if (!proxy.write(d)) {
        socket.pause()
        proxy.on('drain', function () { socket.resume() })
        setTimeout(function () { socket.resume() }, 100)
      }
    } catch (err) {
      // TODO handle err
    }
  })

  proxy.on('error', function (err) {
    error(`ignore: ${err}`)
  })

  socket.on('error', (err) => {
    error(`ignore: ${err}`)
  })

  proxy.on('close', function (hadError) {
    try {
      if (hadError) {
        error(`socks connection close unexpectedly ${address} ${port}`)
      }
      socket.close()
    } catch (err) {
    }
  })
}


function torProxy (socket, address, port, proxyReady) {
  
  var proxy = socksClient.createConnection({socksHost:'localhost',socksPort: config.torPort, port: port, host: address})
  
  


  connectionStats.remoteSocketConnected(socket, proxy)

  proxy.on('connect', () => {
    // console.log("connected")
    proxyReady()
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
    try {
      if (!proxy.write(d)) {
        socket.pause()
        proxy.on('drain', function () { socket.resume() })
        setTimeout(function () { socket.resume() }, 100)
      }
    } catch (err) {
      // TODO handle err
    }
  })

  proxy.on('error', function (err) {
    error(`ignore: ${err}`)
  })

  socket.on('error', (err) => {
    error(`ignore: ${err}`)
  })

  proxy.on('close', function (hadError) {
    try {
      if (hadError) {
        error(`socks connection close unexpectedly ${address} ${port}`)
      }
      socket.close()
    } catch (err) {
    }
  })
}



function sendToWebPanel (socket, address, port, proxyReady) {
  if (port === 443) {
    debug(`Forwarding webpanel cachebrowser request ${address}:${port}`)
    return cachebrowse(socket, 'yaler.co', port, proxyReady)
  } else {
    debug('Forwarding request to webpanel')
    return regularProxy(socket, '127.0.0.1', config.web.port, proxyReady)
  }
}

function sendToNoHostHandler (socket, address, port, proxyReady) {
  return regularProxy(socket, '127.0.0.1', config.noHostHandlerPort, proxyReady)
}
