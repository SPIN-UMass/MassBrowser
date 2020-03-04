import axios from 'axios'
import WebSocket from 'ws'

import * as errors from '~/utils/errors'
import { debug, warn, error } from '~/utils/log'
import randomstring from 'randomstring'

export class Transport {
  constructor () {
    this.get = this.request.bind(this, 'get')
    this.post = this.request.bind(this, 'post')
    this.delete = this.request.bind(this, 'delete')
    this.put = this.request.bind(this, 'put')
  }

  /**
   * @returns a Promise which resolves with a response implementing the following schema:
   * {
   *  data: {},
   *  status: 200,
   *  statusText: 'OK'
   * }
   */
  request(method, path, data) {
    // Implemented by subclasses
    throw new errors.NotImplementedError()
  }

  async handleResponse (request, response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else if (response.status >= 500) {
      throw new errors.ServerError(response.status, response.statusText, response, request)
    } else if (response.status == 401 || response.status == 403) {
      throw new errors.PermissionDeniedError(response.status, response.statusText, response, request)
    } else {
      throw new errors.RequestError(response.status, response.statusText, response, request)
    }
  }
}


export class HttpTransport extends Transport {
  constructor (baseURL) {
    super()
    this.baseURL = baseURL
    this.authToken = null
  }

  setAuthToken(authToken) {
    this.authToken = authToken
  }

  async request (method, path, data, config) {
    let options = {
      url: path,
      method: method,
      data: data,
      baseURL: this.baseURL
    }

    Object.assign(options, config)
    options.data = options.data || {}

    options.validateStatus = status => true
    this._setHeaders(options)



    return axios.request(options)
    .catch((r) => {
      return this.handleNetworkError({url: path, data: data}, r)
    })
    .then((r) => {
      return this.handleResponse({url: path, data: data}, r)},(err)=>{
      debug(" cannot load address"+path,err)
    })
  }

  _setHeaders (config) {
    if (this.authToken) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = 'Token ' + this.authToken
      config.headers['Content-Type'] =  'application/json'

    }
  }

  handleNetworkError (request, err) {
    throw new errors.NetworkError(err)
  }
}


export class WebSocketTransport extends Transport {
  constructor (url, basePath) {
    super()

    this.connectionMap = {}
    this.url = url
    this.basePath = basePath || ''
    this.eventHandler = null
  }

  setEventHandler (eventHandler) {
    this.eventHandler = eventHandler
  }

  reconnect () {
    return this.connect(this.url)
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url, {
        perMessageDeflate: false,
      })

      this.ws.on('error', (err) => {
        error(err)
      })

      var messageHandlers = {
        reply: m => this.replyReceived(m),
        event: m => this.eventReceived(m),
        auth: m => handleAuth(m)
      }

      this.ws.on('message', (message) => {
        var resp = JSON.parse(message)
        console.log(resp)
        var handler = messageHandlers[resp.type]
        if (handler === undefined) {
          error("Invalid message type received from server")
          return
        }
        handler(resp)
      })

      const handleAuth = resp => {
        if (resp.status == 200) {
          resolve()
        } else {
          reject(new errors.AuthenticationError("Invalid credentials for Websocket connection"))
        }
      }
    })
  }

  eventReceived (resp) {
    this.eventHandler(resp.event, resp.data)
  }

  handleReconnect () {
    this.eventHandler('reconnected','')
  }

  replyReceived (resp) {
    if (resp['message_id'] in this.connectionMap) {
      // debug('I am HERE',this.connectionMap[resp['message_id']])
      let handler = this.connectionMap[resp['message_id']]

      if (handler) {
        handler(resp)
      } else {
        warn("Websocket reply received for a request which doesn't exit")
      }
    }
  }

  request (method, pathtail, data) {
    var path = this.basePath + pathtail

    return new Promise((resolve, reject) => {
      var proto = {}
      proto['id'] = randomstring.generate(8)
      proto['data'] = data
      proto['method'] = method
      proto['path'] = path

      this.connectionMap[proto['id']] = resolve

      var sproto = JSON.stringify(proto)

      this.ws.send(sproto, (err) => {
        if (err) {
          if (this.ws.readyState === WebSocket.CLOSED){
            setTimeout(() => {
              debug('reconnecting')
              this.reconnect()
              .then(() => {
                debug('reconnected')
                this.handleReconnect()
                this.request(method, pathtail, data)
              })
            }, 60)
          } else {
            reject(new errors.NetworkError(err))
          }
        }
      })
    })
    .then(r => this.handleResponse({url: path, data: data}, r))
  }
}

