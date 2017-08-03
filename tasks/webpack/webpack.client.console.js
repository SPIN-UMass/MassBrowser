const mainConfig = require('./webpack.client.console.main')
const consoleConfig = require('./webpack.client.console.control')
const webConfig = require('./webpack.web')

module.exports = [mainConfig, consoleConfig, webConfig]