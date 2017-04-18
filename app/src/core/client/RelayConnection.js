/**
 * Created by milad on 4/11/17.
 */
import net from 'net'
import { Crypto } from '../crypt/crypto'
import { EventEmitter } from 'events'

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

  connect() {
    return new Promise((resolve, reject) => {
      try {
        var socket = net.connect(this.relayport, this.relayip, () => resolve(socket))
      } catch (err) {
        reject(err)
      }
    })
    .then((socket) => this._initSocket(socket))
    .then((socket) => this._initRelay(socket))
  }

  _initSocket(socket) {
    socket.on('data', (data) => {
      this.cipher.decrypt(data)
    })

    var desc = this.desc
    var cipher = new Crypto(desc['readkey'], desc['readiv'], desc['writekey'], desc['writeiv'], (d) => {
      this.emit('data', d)
    }, () => {
      this.emit('close')
      this.socket.end()
    })

    this.socket = socket    
    this.cipher = cipher
    
    return socket
  }

  _initRelay(socket) {
    console.log(this.relayip, this.relayport, 'SENDING DATA')

    var desc = this.desc
    var i = Math.random() * (100 - 1) + 1
    var padarr = [Buffer(desc['clientid'])]
    while (i > 0) {
      padarr.push(this.cipher.encryptzero())
      i -= 1
    }

    console.log('I am sending', (Buffer.concat(padarr)))

    socket.write(Buffer.concat(padarr))

    return socket
  }
  
  write (conid, command, data) {
    let sendpacket = Buffer(7)
    sendpacket.writeUInt16BE(conid)
    sendpacket.write(command, 2)
    sendpacket.writeUInt32BE(data.length, 3)
    const b = Buffer.concat([sendpacket, data])
    console.log('writing to the relay', b)
    const enc = this.cipher.encrypt(b)
    console.log('writing to the relay enc', enc)
    this.emit('send', enc)
    this.socket.write(enc)
  }
  
}

