
import { info, warn, debug } from '@utils/log'
import { connectionManager } from './connectionManager'
import { EventEmitter } from 'events'
import { Duplex,Readable } from 'stream'
import { Socket } from 'net'

class MBHandle  extends Readable{
    constructor (socket){
        super()
        this.socket = socket

    }
    // close(){
    //     // this.socket.emit('end')

    // }
    
    write(data){
        // debug('DATA RESPONSE',data.toString())
        
        this.socket.push(data)
        this.socket.resume()
        // this.socket.resume()
    }
    // _read(){

    // }
    _read(size) {
    }
    readStart(){
    }
    end(){
        this.socket.end()
        
    }
    close() {
        this.socket.close()

    }
    shutdown(){
        
        this.emit('end')
        this.emit('close')
        return 0
    }
}

export class MassBrowserTestScoket extends Socket {
    constructor (options) {
        super()
        this.options = options
        this._handle = new MBHandle(this)
        
       
         this._handle.resume()

        
        
    }

    //  write (data,encoding,cb) {
    //      debug('DATATA',data)
    //     if (this.connecting) {
    //         this._pendingData = data
    //         this._pendingEncoding = encoding
    //         this.once('connect', function connect() {
    //           this.write( data, encoding, cb)
    //         });
    //         return
    //       }
    //       debug('WRITING',data)
    //     writeGeneric(this,data,encoding,cb)
    

    // }
    write(data,encoding,cb) {
        debug("MASDFMASFDASF",data)
        if (this.connecting) {
                    this._pendingData = data
                    this._pendingEncoding = encoding
                    this.once('connect', function connect() {
                      this.write( data, encoding, cb)
                    });
                    return
                  }
        
                  debug('writing MSDFMASDF')
        if (encoding !== null)
        {
            this._handle.setEncoding(encoding)

        }
        this._handle.push(Buffer.from(data,encoding))
        debug("AFSA",this._handle.readableLength)
        
        if (cb !== null){
            cb()
        }
        
        
    }
    _read(size){
        
    }

    async connect (onConnect) {
    this.connecting = true
    this.writable = true
    // if (this.write !== Socket.prototype.write)
    //     this.write = Socket.prototype.write

    





        debug(' MMMMMMM creating test connection',this.options.host,this.options.port)
        connectionManager.newClientConnection(this._handle,this.options.host,this.options.port,
        () =>{ 
           
              
                // Callback may come after call to destroy
                // if (this.destroyed) {
                //   return
                // }

                
                debug('afterConnect')
              

                this.connecting = false
                this._sockname = null
                this.readable = true
                
                this.emit('connect')
                this.emit('ready')
                if (onConnect !== null)
                {
                    debug('afterConnect DADY')

                    onConnect(null,this)
                }
                
              
              
            
        }
        )
    }

}

export  function massbrowserCreateConnection(port, host, options) {
    debug('SDFASFA',port,host,options)
    if (port !== null && typeof port === 'object') {
      options = port
      if (host !== null && typeof host === 'function')
        var cb = host
    } else if (host !== null && typeof host === 'object') {
      options = { ...host }
    } else if (options === null || typeof options !== 'object') {
      options = {}
    } else {
      options = { ...options }
    }
  
    if (typeof port === 'number') {
      options.port = port
    }
  
    if (typeof host === 'string') {
      options.host = host
    }
  
    debug('createConnection', options)
  

  
    
    var socket = new MassBrowserTestScoket(options)
    socket.connect(cb)
    console.log(socket.write,Socket.prototype.write)



    return socket
    
  }