const electronMainConfig = require('./webpack.relay.electron.main')
const electronRendererConfig = require('./webpack.relay.electron.renderer')

module.exports = [electronMainConfig, electronRendererConfig]