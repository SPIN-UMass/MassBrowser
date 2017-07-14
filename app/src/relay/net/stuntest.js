/**
 * Created by milad on 7/3/17.
 */
const http = require('http')
const net = require('net')
const url = require('url')

let proxy = net.createServer((req, res) => {
  console.log(req.socket.remotePort)
  req.on('data', (data) => {
    console.log(data)
    res.write(data)
  })
  req.on('end', () => {
    res.end()
  })
})

proxy.listen(5454, '0.0.0.0', () => {
  console.log('HTTP SERVER STARTED',proxy)
  // make a request to a tunneling proxy

  let keepaliveagent = new http.Agent({keepAlive: true})
  let options = {
    hostname: 'localhost',
    port: 5454,
    path: '/',
    method: 'POST',
    agent: keepaliveagent
  }

  var req = http.request(options, (res) => {
    res.on('data', (data) => {
      console.log('resp data', data)
    })
  })
  req.write('test')
  req.write('dafasf')
  setTimeout(() => {
    req.write('test2')
  }, 20)

})

