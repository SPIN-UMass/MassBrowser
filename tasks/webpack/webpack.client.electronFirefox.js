const electronMainConfig = require('./webpack.client.electron.mainFirefox')
const electronRendererConfig = require('./webpack.client.electron.renderer')
const webConfig = require('./webpack.web')

module.exports = [electronMainConfig, electronRendererConfig, webConfig]