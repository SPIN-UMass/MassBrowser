const net = require('net')
import { debug, warn } from '@utils/log'
import { TCPRelayConnection } from './TCPRelayConnection'
import { UDPRelayConnection } from './UDPRelayConnection'
import * as dgram from 'dgram'
import * as rudp from '@common/rudp'

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
    debug('TCP Relay started on ', publicPort)
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        warn('TCP Relay address in use, retrying...')
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

export function runLocalUDPServer (publicAddress, publicPort) {
  return new Promise((resolve, reject) => {
    let socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    let server = new rudp.Server(socket)

    socket.bind({ port: publicPort, address: publicAddress, exclusive: false }, () => {
      debug('UDP Relay started on ', publicPort)
    })

    socket.on('error', err => {
      debug('UDP Relay socket error, ', err)
      if (err.code === 'EADDRINUSE') {
        warn('UDP Relay address in use, retrying...')
        setTimeout(() => {
          socket.close()
          socket.bind({ port: publicPort, address: publicAddress, exclusive: false }, () => {
            debug('UDP Relay started on ', publicPort)
            resolve(socket)
          })
          server = new rudp.Server(socket)
        }, 1000)
      }
    })

    server.on('connection', connection => {
      let receiver = new UDPRelayConnection()
      receiver.relayReverse(connection)
      connection.on('error', (err) => {
        debug('Local UDP Server error: ', err)
        receiver.end()
      })
      connection.on('end', () => {
        receiver.end()
      })
    })
    resolve(socket)
  })
}
