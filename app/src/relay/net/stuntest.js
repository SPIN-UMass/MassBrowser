/**
 * Created by milad on 4/16/17.
 */
var shortenSTUN = true // set to true if your STUN server disconnects too early
var localIP = '0.0.0.0' // You can try 0.0.0.0

var net = require('net')
var stun = require('vs-stun')
var events = require('events')
var server = {
  host: 'stun.l.google.com',
  port: 19302
}
var st = stun.connect(server, (error, socket) => {
  console.log(socket.stun)
  sock = net.createServer((s) => {
    s.pipe(s)
  })
  sock.listen(socket.stun.local.port, socket.stun.local.host)
  console.log('Local listening socket:')
  console.log(sock.address())
}, {short: true})
