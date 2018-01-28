'use strict'

process.env.BABEL_ENV = 'console'

const path = require('path')
const pkg = require('../../app/package.json')
const webpack = require('webpack')

const common = require('./common')

let config = {
  devtool: '#source-map',
  entry: {
    client: ['babel-polyfill', path.join(common.rootDir, 'app/src/relay/main/console.js')]
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    rules: common.rules
  },
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    filename: 'relay.js',
    libraryTarget: 'commonjs2',
    path: path.join(common.rootDir, 'app/dist/relay')
  },
  plugins: common.plugins('relay', 'console'),
  resolve: common.resolve('relay'),
  target: 'node'
}

module.exports = config
