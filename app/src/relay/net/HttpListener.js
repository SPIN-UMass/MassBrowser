/**
 * Created by milad on 7/3/17.
 */
const http = require('http')
const net = require('net')
const url = require('url')
import { CDNManager } from './CDNManager'
export function runHTTPListener (port) {
  let proxy = http.createServer((req, res) => {
    CDNManager.handleIncommingConnection(req, res)
  })
  return new Promise((resolve,reject)=>{
    proxy.listen(port, '0.0.0.0', () => {
      console.log('HTTP SERVER STARTED')
      resolve()
      // make a request to a tunneling proxy
    })
  })
}