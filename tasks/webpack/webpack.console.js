const clientBundle = require('./webpack.client.console')
const relayBundle = require('./webpack.relay.console')
// const test = require('./webpack.relay.console.main')

module.exports = clientBundle.concat(relayBundle)

console.log(
    module.exports
  )