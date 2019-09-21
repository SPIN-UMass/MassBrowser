import config from '@utils/config'
export * from './common'

export let store

if (config.isElectronRendererProcess) {
  store = require('./renderer').store
} else {
  store = require('./main').store
}

