import config from '@utils/config'

export let remoteModel
export let getService
export let remote
export let createController

if (config.applicationInterface === 'electron') {
  if (config.isElectronRendererProcess) {
    const renderer = require('./renderer')
    getService = renderer.getService
    remote = renderer.remote
    createController = function(name, ctrlClass) {
      return getService(`ctrl:${name}`)
    }
    remoteModel = function(name) {
      return getService(`model:${name}`)
    }
  } else {
    const main = require('./main')

    remote = main.remote
    createController = function (name, ctrlClass) {
      let ctrl = typeof ctrlClass === 'object' ? ctrlClass : new ctrlClass()
      remote.registerService(`ctrl:${name}`, ctrl)
      return ctrl
    }
    remoteModel = function(name, modelFactory) {
      const model = modelFactory()
      remote.registerService(`model:${name}`, model)
      return model
    }
  }
} else {
  remoteModel = (name, modelFactory) => modelFactory()
}
