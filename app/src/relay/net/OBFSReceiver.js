/**
 * Created by milad on 4/15/17.
 */
const net = require('net')
const fs = require('fs')
import { ConnectionReceiver } from './ConnectionReceiver'
var ThrottleGroup = require('./throttle').ThrottleGroup

export function runOBFSserver (publicIP, publicPort) {
  var up_limit = ThrottleGroup({rate: 100000000})

  var down_limit = ThrottleGroup({rate: 100000000})
  const server = net.createServer((socket) => {
    console.log('relay connected',
      socket.authorized ? 'authorized' : 'unauthorized')
    // var dd=socket.pipe(tg.throttle())
    var my_up = up_limit.throttle()
    var my_down = down_limit.throttle()
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
    socket.on('close', () => {
      console.log('socket clossing')
      recver.closeConnections()
      socket.unpipe(my_up)
      my_down.unpipe(socket)
      my_down.end()
      my_up.end()
    })
  })

  server.listen({port:publicPort, host:publicIP,exclusive:false}, () => {
    console.log('relay bound')
  })
  console.log('test relay started on ', publicPort)
  return new Promise((resolve, reject) => {
    resolve(publicPort)
  })
}
