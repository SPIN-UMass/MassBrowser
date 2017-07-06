/**
 * Created by milad on 7/5/17.
 */
/**
 * Created by milad on 4/11/17.
 */
import net from 'net'
import { Crypto } from '~/utils/crypto'
import { EventEmitter } from 'events'
import { logger, debug, warn } from '~/utils/log'
import config from '~/utils/config'
import { RelayConnectionError } from '~/utils/errors'
import https from 'https'

export default class DomainConnection extends EventEmitter {
  constructor (domainName, desc) {
    super()

    this.id = ''
    this.domainName = domainName
    this.desc = desc
    this.agent = new https.Agent({keepAlive: true})
    this.cipher = null
    this.option = {
      hostname: this.domainName,
      port: 443,
      path: '/',
      method: 'POST',
      agent: this.agent,
      servername: 'test'
    }


    console.log('New Domain Session', this.option)
    this.httpsRequest = null
    this.httpsResponse = null
  }

  keepalive () {
    this.write(0, 'K', Buffer(0))
  }

  connect () {
    return new Promise((resolve, reject) => {
      console.log('Connecting to CDN')
      var httpsRequest = https.request(this.option, (res) => {
        this.httpsResponse = res
        setInterval(() => {this.keepalive}, 500)
        this.httpsResponse.on('data', (data) => {
          this.cipher.decrypt(data)
        })
      })

      const onFail = (err) => {
        warn(`Relay ${this.id} connection error: ${err.message}`)
        reject(new RelayConnectionError(err))
      }

      const onSuccess = () => {
        debug(`Relay ${this.id} connected`)

        // Remove connection failure callback so it isn't called
        // in case of a later error in the connection
        httpsRequest.socket.removeListener('error', onFail)

        resolve(httpsRequest)
      }

      /* socket.setTimeout(config.relayConnectionTimeout, () => {
       socket.end()
       onFail(new Error('Connection Timeout'))
       }) */
      httpsRequest.once('socket', onSuccess)
      httpsRequest.once('clientError', onFail)
    })
      .then((httpsRequest, response) => this._initSocket(httpsRequest, response))
      .then((httpsRequest, response) => this._initRelay())
  }

  _initSocket (httpsRequest) {
    var desc = this.desc
    console.log('log', desc)
    var cipher = new Crypto(desc['readkey'], desc['readiv'], desc['writekey'], desc['writeiv'], (d) => {
      this.emit('data', d)
    }, () => {
      this.emit('close')
      this.httpsRequest.end()
    })

    this.httpsRequest = httpsRequest
    this.cipher = cipher

    return httpsRequest
  }

  _initRelay () {
    // console.log(this.relayip, this.relayport, 'SENDING DATA')

    var desc = this.desc
    var i = Math.random() * (100 - 1) + 1
    var padarr = [Buffer(desc['token'])]
    while (i > 0) {
      padarr.push(this.cipher.encryptzero())
      i -= 1
    }

    this.httpsRequest.write(Buffer.concat(padarr))
  }

  end () {
    this.httpsRequest.end()
  }

  write (conid, command, data) {
    let sendpacket = Buffer(7)
    sendpacket.writeUInt16BE(conid)
    sendpacket.write(command, 2)
    sendpacket.writeUInt32BE(data.length, 3)
    const b = Buffer.concat([sendpacket, data])
    // console.log('writing to the relay')
    const enc = this.cipher.encrypt(b)
    // console.log('writing to the relay enc', enc)
    this.emit('send', enc)
    this.httpsRequest.write(enc)
    // console.log('written')
  }

}

