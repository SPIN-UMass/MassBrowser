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
  constructor (relayip, relayport, desc) {
    super()

    this.id = ''
    this.relayip = relayip
    this.relayport = relayport
    this.desc = desc
    this.agent = new https.Agent({keepAlive: true})
    this.cipher = null
    this.option = {
      hostname: 'd2td5r0tz3q2r2.cloudfront.net',
      port: 443,
      path: '/',
      method: 'POST',
      agent: this.agent
    }
    this.httpsRequest = null
    this.httpsResponse = null
  }

  connect () {
    return new Promise((resolve, reject) => {
      var httpsRequest = https.request(this.options, (res) => {
        onSuccess(res)
      })

      const onFail = (err) => {
        warn(`Relay ${this.id} connection error: ${err.message}`)
        reject(new RelayConnectionError(err))
      }

      const onSuccess = (res) => {
        debug(`Relay ${this.id} connected`)

        // Remove connection failure callback so it isn't called
        // in case of a later error in the connection
        httpsRequest.socket.removeListener('error', onFail)

        resolve(httpsRequest, res)
      }

      /* socket.setTimeout(config.relayConnectionTimeout, () => {
       socket.end()
       onFail(new Error('Connection Timeout'))
       }) */

      httpsRequest.once('clientError', onFail)
    })
      .then((httpsRequest, response) => this._initSocket(httpsRequest, response))
      .then((httpsRequest, response) => this._initRelay())
  }

  _initSocket (httpsRequest, response) {
    var desc = this.desc
    console.log('log', desc)
    var cipher = new Crypto(desc['readkey'], desc['readiv'], desc['writekey'], desc['writeiv'], (d) => {
      this.emit('data', d)
    }, () => {
      this.emit('close')
      this.httpsRequest.end()
    })

    this.httpsRequest = httpsRequest
    this.httpsResponse = response
    this.cipher = cipher
    this.httpsResponse.on('data', (data) => {
      this.cipher.decrypt(data)
    })

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

