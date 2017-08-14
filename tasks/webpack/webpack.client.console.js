const mainConfig = require('./webpack.client.console.main')
const controlConfig = require('./webpack.client.console.control')
const webConfig = require('./webpack.web')

module.exports = [mainConfig, controlConfig, webConfig]