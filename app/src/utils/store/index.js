import config from '@utils/config'
export * from './common'
// export * from './main'
// export * from './renderer'
import * as renderer from './renderer'
import * as main from './main'
export let store;

if (config.isElectronRendererProcess) {
  store = renderer.store
} else {
  store = main.store
}


// module.exports = {
//   ...(config.isElectronProcess ? require('./renderer') : require('./main')),
// }
