import config from '@utils/config'
export * from './common'

if (config.isElectronRendererProcess) {
  module.exports = require('./renderer')
} else {
  module.exports = require('./main')
}

