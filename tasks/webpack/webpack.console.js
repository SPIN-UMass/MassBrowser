const clientBundle = require('./webpack.client.console')
const relayBundle = require('./webpack.relay.console')

module.exports = clientBundle.concat(relayBundle)