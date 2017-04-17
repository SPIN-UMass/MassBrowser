/**
 * Created by milad on 4/15/17.
 */
const net = require('net')
const fs = require('fs')
import {ConnectionReceiver} from './ConnectionReceiver'

export function runOBFSserver (port) {


  const server = net.createServer((socket) => {
    console.log('server connected',
      socket.authorized ? 'authorized' : 'unauthorized')

    var recver = new ConnectionReceiver(socket)
  })

  server.listen(port, () => {
    console.log('server bound')
  })
  console.log('test server started on ', port)
}
