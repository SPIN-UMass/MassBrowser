/**
 * Created by milad on 4/16/17.
 */
var shortenSTUN = true // set to true if your STUN server disconnects too early
var localIP = '0.0.0.0' // You can try 0.0.0.0

var net = require('net')
var stun = require('vs-stun')
var events = require('events')
var server = {
  host: 'yaler.co',
  port: 19302
}
var sk= net.connect(server, () => {
})
sk.on('connect',()=>{
  var sock = net.createServer((s) => {
    s.pipe(s)
  })
  sock.listen(sk.localAddress, sk.localport)
  console.log('Local listening socket:')
  console.log(sock.address())
})
