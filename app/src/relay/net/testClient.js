/**
 * Created by milad on 7/5/17.
 */
/**
 * Created by milad on 7/3/17.
 */
const https = require('https')
const net = require('net')
const url = require('url')

let keepaliveagent = new https.Agent({keepAlive: true})
let options = {
  hostname: 'd2td5r0tz3q2r2.cloudfront.net',
  port: 443,
  path: '/',
  method: 'POST',
  agent: keepaliveagent
}

var req = https.request(options, (res) => {
  res.on('data', (data) => {
    console.log('resp data', data.toString())
  })
})
req.write('test')
req.write('dafasf')
setInterval(() => {
  req.write('test2')

}, 100)
