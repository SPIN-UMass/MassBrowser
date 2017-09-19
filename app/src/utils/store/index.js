import config from '@utils/config'
export { State, PersistedState, RendererCachedPersistedState } from './common'

if (config.isElectronRendererProcess) {
  module.exports = require('./renderer')
} else {
  module.exports = require('./main')
}

