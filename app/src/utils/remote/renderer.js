import { ipcRenderer } from 'electron'
import { EventEmitter } from 'events'

import * as errors from '@utils/errors'

const services = {}
const pendingRequests = {}

export function getService(serviceName) {
  if (!(serviceName in services)) {
    services[serviceName] = createServiceProxy(serviceName)
  }
  return services[serviceName]
}

function deserializeError(err) {
  let name = err.name
  let errClass
  if (name in errors) {
    errClass = errors[name]
  } else if (name in window) {
    errClass = window[name]
  } else {
    throw TypeError(`Unknown error occured in remote call: ${err.name}`)
  }

  var e = new errClass()
  e.message = err.message
  // Not going to put in the original stack as it's probably going to be garbage
  // when trying to unminify it from the renderer sourcemap
  // e.stack = err.stack

  return e
}

function createServiceProxy(serviceName) {
  let eventEmitter = new EventEmitter()
  let requestCounter = 1

  function sendRequest(event, property, args) {
    let requestID = `${serviceName}:${requestCounter++}`
    // console.log(`${requestID} ${event} ${serviceName}.${property}`)
    return new Promise((resolve, reject) => {
      ipcRenderer.send(event, {
        id: requestID,
        async: true,
        service: serviceName,
        property,
        args
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
      let promisizedFunction = Object.assign(function(){}, {
        then: p.then.bind(p),
        catch: p.catch.bind(p),
        finally: p.finally.bind(p),
      })
      return new Proxy(promisizedFunction, {
        apply: (target, thisArg, args) => {
          return p.then(reply => {
            if (reply !== '[@function@]') {
              throw new TypeError(`${property} is not a function`)
            }
            return sendRequest('remote.service.call', property, args)
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
    // console.log(`REPLY`)
    // console.log(reply)
    let p = pendingRequests[reply.id]
    if (reply.error) {
      p.reject(deserializeError(reply.error))
    } else {
      p.resolve(reply.response)
    }
  })

  ipcRenderer.on('remote.service.event', (event, details) => {
    // console.log("REMOTE EVENT")
    // console.log(details)
    services[details.service].emit(details.event, ...details.args)
  })
}
