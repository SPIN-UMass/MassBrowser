'use strict'

process.env.BABEL_ENV = 'electron-main'

const path = require('path')
const pkg = require('../../app/package.json')
const webpack = require('webpack')

const common = require('./common')

let config = {
  devtool: '#source-map',
  entry: {
    main: ['babel-polyfill', path.join(common.rootDir, 'app/src/relay/main/electron/main.js')]
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
    filename: 'electron.main.js',
    libraryTarget: 'commonjs2',
    path: path.join(common.rootDir, 'app/dist/relay')
  },
  plugins: common.plugins('relay', 'electron'),
  resolve: common.resolve('relay'),
  target: 'electron-main'
}


module.exports = config
