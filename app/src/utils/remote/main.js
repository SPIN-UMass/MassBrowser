import { EventEmitter } from 'events'
import { ipcMain } from 'electron'

const services = {}

export class ServiceRegistry {
  constructor() {
    this.services = {}
    this.webContents = null
    this._initIPCListeners()
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

  _patchServiceEventEmitter(serviceName, service) {
    var oldEmitter = service.emit
    let self = this
    service.emit = function(event, ...args) {
      self.webContents.send('remote.service.event', {
        service: serviceName,
        event,
        args
      })
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
        event.sender.send('remote.service.reply', {
          id: details.id,
          response: service[property],
          type: typeof service[property],
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

      function sendError(error) {
        event.sender.send('remote.service.reply', {
          id: details.id,
          error: error
        })
      }

      if (async) {
        try {
          let response = service[property]() 
          if (response instanceof Promise) {
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

// export function registerService(contents, serviceName, service) {
//   if (service instanceof EventEmitter) {
//     patchServiceEventEmitter(contents, serviceName, service)
//   }
//   services[serviceName] = service
// }

// function patchServiceEventEmitter(contents, serviceName, service) {
//   var oldEmitter = service.emit
//   service.emit = function(event, ...args) {
//     contents.send('remote.service.event', {
//       service: serviceName,
//       event,
//       args
//     })
//     oldEmitter.apply(service, arguments)
//   }
// }

// // if in main process
// if (ipcMain) {
//   ipcMain.on('remote.service.get', (event, details) => {
//     let service = services[details.service]
//     let property = details.property
//     let async = details.async

//     if (!service) {
//       throw `Service with name ${details.service} is not registered`
//     }

//     if (async) {
//       event.sender.send('remote.service.reply', {
//         id: details.id,
//         response: service[property],
//         type: typeof service[property],
//         action: 'get',
//         property
//       })
//     } else {
//       event.returnValue = service[property]
//     }
//   })

//   ipcMain.on('remote.service.set', (event, details) => {
//     let service = services[details.service]
//     let property = details.property
//     let async = details.async

//     if (!service) {
//       throw `Service with name ${details.service} is not registered`
//     }

//     if (async) {
//       event.sender.send('remote.service.reply', {
//         id: details.id,
//         response: null
//       })
//     } else {
//       event.returnValue = null
//     }
//   })

//   ipcMain.on('remote.service.call', (event, details) => {
//     let service = services[details.service]
//     let property = details.property
//     let async = details.async

//     if (!service) {
//       throw `Service with name ${details.service} is not registered`
//     }

//     function sendResponse(response) {
//       event.sender.send('remote.service.reply', {
//         id: details.id,
//         response: response,
//         action: 'call',
//         property
//       })
//     }

//     function sendError(error) {
//       event.sender.send('remote.service.reply', {
//         id: details.id,
//         error: error
//       })
//     }

//     if (async) {
//       try {
//         let response = service[property]() 
//         if (response instanceof Promise) {
//           response
//           .then(response => sendResponse(response))
//           .catch(err => sendError(err))
//         } else {
//           sendResponse(response)
//         }
//       } catch (err) {
//         sendError(err)
//       }
//     } else {
//       event.returnValue = service[property]()
//     }
//   })
// }
