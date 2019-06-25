import { UDPRelayConnection } from './UDPRelayConnection'
import { debug, warn } from '@utils/log'
import * as dgram from 'dgram'

export function runLocalUDPServer (publicIP, publicPort) {
  return new Promise((resolve, reject) => {
    let socket = dgram.createSocket('udp4')
    socket.bind(publicPort, publicIP, () => {
      debug('Relay started on ', publicPort)
      resolve(socket)
    })

    let recver = new UDPRelayConnection()
    recver.relayReverse(socket)

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
      recver.end()
    })

    socket.on('close', () => {
      recver.end()
    })
  })
}
