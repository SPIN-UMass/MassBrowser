
'use strict'
process.env.BABEL_ENV = 'console'

const path = require('path')
const pkg = require('../../app/package.json')
const webpack = require('webpack')

const common = require('./common')

let config = {
  devtool: '#source-map',
  entry: {
    control: ['babel-polyfill',path.join(common.rootDir, 'app/src/client/main/control.js')]
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    rules: common.rules
  },
  node: {
    __dirname: true,
    __filename: false
  },
  output: {
    filename: 'control.js',
    libraryTarget: 'commonjs2',
    path: path.join(common.rootDir, 'app/dist/client')
  },
  plugins: common.plugins('client', 'control'),
  resolve: common.resolve('client'),
  target: 'node'
}

module.exports = config


