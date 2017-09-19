import { EventEmitter } from 'events'
import { ipcMain } from 'electron'

import { error } from '@utils/log'

const services = {}

function serializeError(err) {
  return {
    name: err.name,
    message: err.message,
    stack: err.stack
  }
}

class Remote {
  constructor() {
    this.services = {}
    this.webContents = null
    this._initIPCListeners()

    this.pendingMessages = {}
  }

  registerService(serviceName, service) {
    if (service instanceof EventEmitter) {
      this._patchServiceEventEmitter( serviceName, service)
    }
    this.services[serviceName] = service
  }

  setWebContents(contents) {
    this.webContents = contents
  }

  send(...args) {
    if (this.webContents) {
      return this.webContents.send(...args)
    }
  }

  on(event, ...args) {
    return ipcMain.on(event, ...args)
  }

  _patchServiceEventEmitter(serviceName, service) {
    var oldEmitter = service.emit
    let self = this
    service.emit = function(event, ...args) {
      // console.log("REMOTE EVENT")
      // console.log(args)
      if (self.webContents) {
        self.webContents.send('remote.service.event', {
          service: serviceName,
          event,
          args
        })
      }
      oldEmitter.apply(service, arguments)
    }
  }

  _initIPCListeners() {
    ipcMain.on('remote.service.get', (event, details) => {
      let service = this.services[details.service]
      let property = details.property
      let async = details.async
      if (!service) {
        throw `Service with name ${details.service} is not registered`
      }

      if (async) {
        let response = service[property]
        event.sender.send('remote.service.reply', {
          id: details.id,
          response: typeof response === 'function' ? '[@function@]' : response,
          action: 'get',
          property
        })
      } else {
        event.returnValue = service[property]
      }
    })

    ipcMain.on('remote.service.set', (event, details) => {
      let service = this.services[details.service]
      let property = details.property
      let async = details.async

      if (!service) {
        throw `Service with name ${details.service} is not registered`
      }

      if (async) {
        event.sender.send('remote.service.reply', {
          id: details.id,
          response: null
        })
      } else {
        event.returnValue = null
      }
    })

    ipcMain.on('remote.service.call', (event, details) => {
      let service = this.services[details.service]
      let property = details.property
      let args = details.args
      let async = details.async

      if (!service) {
        throw `Service with name ${details.service} is not registered`
      }

      function sendResponse(response) {
        event.sender.send('remote.service.reply', {
          id: details.id,
          response: response,
          action: 'call',
          property
        })
      }

      function sendError(err) {
        /* TODO Custom error objects have circular properties which won't 
           allow them to be serialized, should fix that but for now just remove the properties here
           since they're not important */
        err.response = undefined
        err.request = undefined

        error(`${err.name} occured in renderer remote service`)
        error(err)
        event.sender.send('remote.service.reply', {
          id: details.id,
          error: serializeError(err)
        })
      }

      if (async) {
        try {
          let response = service[property].apply(service, args)
          if (response && response.then !== undefined) {
            response
            .then(response => sendResponse(response))
            .catch(err => sendError(err))
          } else {
            sendResponse(response)
          }
        } catch (err) {
          sendError(err)
        }
      } else {
        event.returnValue = service[property]()
      }
    })
  }
}

export const remote = new Remote()