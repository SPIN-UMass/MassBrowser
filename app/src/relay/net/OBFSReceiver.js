/**
 * Created by milad on 4/15/17.
 */
const net = require('net')
const fs = require('fs')
import { ConnectionReceiver } from './ConnectionReceiver'
var ThrottleGroup = require('./throttle').ThrottleGroup
import { relayManager } from '@/services'

export function runOBFSserver (publicIP, publicPort, up_limit, down_limit) {

  const server = net.createServer((socket) => {
    console.log('relay connected',
      socket.authorized ? 'authorized' : 'unauthorized')
    // var dd=socket.pipe(tg.throttle())
    var my_up = up_limit.throttle()
    my_up.on('error', (err) => {})
    var my_down = down_limit.throttle()
    my_down.on('error', (err) => {})

    socket.pipe(my_up)
    my_down.pipe(socket)

    var recver = new ConnectionReceiver(my_up, my_down, socket)
    socket.on('error', (err) => {
      console.log('socket error', err.message)
      recver.closeConnections()
      socket.unpipe(my_up)
      my_down.unpipe(socket)
      my_down.end()
      my_up.end()
    })
    socket.on('end', () => {
      console.log('socket ending')
      recver.closeConnections()

      socket.unpipe(my_up)
      my_down.unpipe(socket)
      my_down.end()
      my_up.end()
    })
  })
  return new Promise((resolve, reject) => {
    console.log('starting server on port', publicPort)
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
          server.listen({port: publicPort, host: '0.0.0.0', exclusive: false}, () => {
            console.log('relay bound')
            resolve(server)
          })
        }, 1000)
      }
    })
  })
}
export function connectToClient (clientIP, clientPort, token) {
  console.log('Connecting to',clientIP,clientPort)
  const socket = net.connect({host: clientIP, port: clientPort}, (err) => {
    if (err) {
      console.log(err)
    }
    console.log("CONNECTED TO CLIENT")
    var my_up = relayManager.uploadLimiter.throttle()
    my_up.on('error', (err) => {})
    var my_down = relayManager.downloadLimiter.throttle()
    my_down.on('error', (err) => {})

    socket.write(token)
    socket.pipe(my_up)
    my_down.pipe(socket)

    var recver = new ConnectionReceiver(my_up, my_down, socket)
    socket.on('error', (err) => {
      console.log('socket error', err.message)
      recver.closeConnections()
      socket.unpipe(my_up)
      my_down.unpipe(socket)
      my_down.end()
      my_up.end()
    })
    socket.on('end', () => {
      console.log('socket ending')
      recver.closeConnections()

      socket.unpipe(my_up)
      my_down.unpipe(socket)
      my_down.end()
      my_up.end()
    })

  })

}