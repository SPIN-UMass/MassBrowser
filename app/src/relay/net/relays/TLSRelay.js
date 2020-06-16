import tls from 'tls'
import fs from 'fs'
import { ConnectionReceiver } from '@/net'

export default class TLSRelay {
  constructor(keyPath, certPath, port) {
    this.port = port
    this.keyPath = keyPath
    this.certPath = certPath
  }

  startRelay() {
    const options = {
      key: fs.readFileSync(this.keyPath),
      cert: fs.readFileSync(this.certPath),
      rejectUnauthorized: false,
      // This is necessary only if using the client certificate authentication.
      requestCert: false
  
    }
  
    const server = tls.createServer(options, (socket) => {
      var recver = new ConnectionReceiver(socket)
    })
  
    server.listen(port, () => {})
  }
}