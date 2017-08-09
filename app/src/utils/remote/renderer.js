import { ipcRenderer } from 'electron'
import { EventEmitter } from 'events'

const services = {}
const pendingRequests = {}

export function getService(serviceName) {
  if (!(serviceName in services)) {
    services[serviceName] = createServiceProxy(serviceName)
  }
  return services[serviceName]
}

function createServiceProxy(serviceName) {
  let eventEmitter = new EventEmitter()
  let requestCounter = 1

  function sendRequest(event, property) {
    let requestID = `${serviceName}:${requestCounter++}`
    // console.log(`${requestID} ${event} ${serviceName}.${property}`)
    return new Promise((resolve, reject) => {
      ipcRenderer.send(event, {
        id: requestID,
        async: true,
        service: serviceName,
        property
      })
      pendingRequests[requestID] = {resolve, reject}
    })
  }
  
  let proxy = {
    on: function() {
      eventEmitter.on.apply(eventEmitter, arguments)
    },
    addListerer: function() {
      eventEmitter.addListener.apply(eventEmitter, arguments)
    },
    removeListener: function() {
      eventEmitter.removeListener.apply(eventEmitter, arguments)
    },
    emit: function() {
      eventEmitter.emit.apply(eventEmitter, arguments)
    }
  }

  return new Proxy(proxy, {
    get: (target, property) => {
      if (target[property] !== undefined) {
        return target[property]
      }

      let p = sendRequest('remote.service.get', property)

      return new Proxy(p, {
        apply: (target, thisArg, args) => {
          return p.then(reply => {
            if (reply.type !== 'function') {
              throw `${property} is not a function`
            }
            return sendRequest('remote.service.call', property)
          })
        }
      })
    },
    set: (target, property, value) => {
      throw "Remote 'set' not implemented"
    }
  })
}

// if in renderer process
if (ipcRenderer) {
  ipcRenderer.on('remote.service.reply', (event, reply) => {
    let p = pendingRequests[reply.id]
    if (reply.error) {
      p.reject(reply.error)
    } else {
      p.resolve(reply.response)
    }
  })

  ipcRenderer.on('remote.service.event', (event, details) => {
    services[details.service].emit(details.event, ...details.args)
  })
}
