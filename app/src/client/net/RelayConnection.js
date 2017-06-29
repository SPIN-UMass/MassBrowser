/**
 * Created by milad on 4/11/17.
 */
import net from 'net'
import { Crypto } from '~/utils/crypto'
import { EventEmitter } from 'events'
import { logger, debug, warn } from '~/utils/log'
import config from '~/utils/config'
import { RelayConnectionError } from '~/utils/errors'

export default class RelayConnection extends EventEmitter {
  constructor (relayip, relayport, desc) {
    super()

    this.id = ''
    this.relayip = relayip
    this.relayport = relayport
    this.desc = desc

    this.cipher = null
    this.socket = null
  }

  connect () {
    return new Promise((resolve, reject) => {
      var socket = net.connect(this.relayport, this.relayip)

      const onFail = (err) => {
        warn(`Relay ${this.id} connection error: ${err.message}`)
        reject(new RelayConnectionError(err))
      }

      const onSuccess = () => {
        debug(`Relay ${this.id} connected`)

        // Remove connection failure callback so it isn't called
        // in case of a later error in the connection
        socket.removeListener('error', onFail)

        resolve(socket)
      }

      /* socket.setTimeout(config.relayConnectionTimeout, () => {
       socket.end()
       onFail(new Error('Connection Timeout'))
       }) */

      socket.once('connect', onSuccess)
      socket.once('error', onFail)
    })
      .then((socket) => this._initSocket(socket))
      .then((socket) => this._initRelay(socket))
  }

  _initSocket (socket) {


    var desc = this.desc
    console.log('log',desc)
    var cipher = new Crypto(desc['readkey'], desc['readiv'], desc['writekey'], desc['writeiv'], (d) => {
      this.emit('data', d)
    }, () => {
      this.emit('close')
      this.socket.end()
    })

    this.socket = socket
    this.cipher = cipher
    socket.on('data', (data) => {
      this.cipher.decrypt(data)
    })

    return socket
  }

  _initRelay (socket) {
    // console.log(this.relayip, this.relayport, 'SENDING DATA')

    var desc = this.desc
    var i = Math.random() * (100 - 1) + 1
    var padarr = [Buffer(desc['token'])]
    while (i > 0) {
      padarr.push(this.cipher.encryptzero())
      i -= 1
    }

    socket.write(Buffer.concat(padarr))

    return socket
  }

  end () {
    this.socket.end()
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
    this.socket.write(enc)
    // console.log('written')
  }

}

