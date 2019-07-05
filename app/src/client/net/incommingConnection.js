const net = require('net')
import { debug, warn } from '@utils/log'
import { TCPRelayConnection } from './TCPRelayConnection'
import { UDPRelayConnection } from './UDPRelayConnection'
import * as dgram from 'dgram'

export function runLocalTCPServer (publicIP, publicPort) {
  const server = net.createServer((socket) => {
    let receiver = new TCPRelayConnection()
    receiver.relayReverse(socket)
    socket.on('error', (err) => {
      debug('Local TCP Server error: ', err)
      receiver.end()
    })
    socket.on('end', () => {
      receiver.end()
    })
  })

  return new Promise((resolve, reject) => {
    server.listen({port: publicPort, host: '0.0.0.0', exclusive: false}, () => {
      resolve(server)
    })
    debug('Relay started on ', publicPort)
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        warn('Relay address in use, retrying...')
        setTimeout(() => {
          server.close()
          server.listen({port: publicPort, host: '0.0.0.0', exclusive: false}, () => {
            resolve(server)
          })
        }, 1000)
      }
    })
  })
}

export function runLocalUDPServer (publicIP, publicPort) {
  return new Promise((resolve, reject) => {
    let socket = dgram.createSocket('udp4')
    socket.bind(publicPort, publicIP, () => {
      debug('Relay started on ', publicPort)
      resolve(socket)
    })

    let receiver = new UDPRelayConnection()
    receiver.relayReverse(socket)

    socket.on('error', err => {
      debug('udp socket error, ', err)

      if (err.code === 'EADDRINUSE') {
        warn('Relay address in use, retrying...')
        setTimeout(() => {
          socket.close()
          socket.bind(publicPort, publicIP, () => {
            resolve(socket)
          })
        }, 1000)
      }
      receiver.end()
    })

    socket.on('close', () => {
      receiver.end()
    })
  })
}
