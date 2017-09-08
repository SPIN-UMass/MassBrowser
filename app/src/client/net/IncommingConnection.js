/**
 * Created by milad on 9/7/17.
 */
/**
 * Created by milad on 4/15/17.
 */
const net = require('net')
const fs = require('fs')
import RelayConnection from '@/net/RelayConnection'

export function runLocalServer (publicIP, publicPort) {

  const server = net.createServer((socket) => {
    console.log('client connected',
      socket.authorized ? 'authorized' : 'unauthorized')
    // var dd=socket.pipe(tg.throttle())


    var recver = new RelayConnection()
    recver.relayReverse(socket)
    socket.on('error', (err) => {
      console.log('socket error', err.message)
      recver.end()

    })
    socket.on('end', () => {
      console.log('socket ending')
      recver.end()


    })
  })
  return new Promise((resolve, reject) => {
    console.log("starting server on port",publicPort)
    server.listen({port: publicPort, host: '0.0.0.0', exclusive: false}, () => {
      console.log('relay bound')
      resolve(server)
    })
    console.log('relay started on ', publicPort)
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log('Address in use, retrying...')
        setTimeout(() => {
          server.close()
          server.listen({port: publicPort, host: '0.0.0.0', exclusive: false},()=>{
            console.log('relay bound')
            resolve(server)
          })
        }, 1000)
      }
    })
  })
}
