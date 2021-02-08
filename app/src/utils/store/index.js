import config from '@utils/config'
export * from './common'

module.exports = {
  ...(config.isElectronProcess && config.isElectronRendererProcess ? require('./renderer') : require('./main')),
}
