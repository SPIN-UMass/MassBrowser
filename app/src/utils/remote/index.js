import config from '@utils/config'

if (config.isElectronMainProcess) {
  const { remote } = require('./main')

  module.exports = {
    remote,
    createController: function(name, ctrlClass) {
      let ctrl = typeof ctrlClass === 'object' ? ctrlClass : new ctrlClass()
      remote.registerService(`ctrl:${name}`, ctrl)
      return ctrl
    },
    remoteModel: function(name, modelFactory) {
      const model = modelFactory()
      remote.registerService(`model:${name}`, model)
      return model
    }
  }

} else if (config.isElectronRendererProcess) {
  const { remote, getService } = require('./renderer')

  module.exports = {
    getService,
    remote,
    createController: function(name, ctrlClass) {
      return getService(`ctrl:${name}`)
    },
    remoteModel: function(name) {
      return getService(`model:${name}`)
    }
  }
}