/**
 * Created by milad on 4/15/17.
 */
const net = require('net')
const fs = require('fs')
import {ConnectionReceiver} from './ConnectionReceiver'
var ThrottleGroup = require('./throttle').ThrottleGroup;



export function runOBFSserver (port) {

  var up_limit= ThrottleGroup({rate:100000})
  var down_limit = ThrottleGroup({rate:100000})
  const server = net.createServer((socket) => {
    console.log('server connected',
      socket.authorized ? 'authorized' : 'unauthorized')
    //var dd=socket.pipe(tg.throttle())
    var my_up= up_limit.throttle()
    var my_down= down_limit.throttle()
    socket.pipe(my_up)
    my_down.pipe(socket)

    var recver = new ConnectionReceiver(my_up,my_down )
  })

  server.listen(port, () => {
    console.log('server bound')
  })
  console.log('test server started on ', port)
}