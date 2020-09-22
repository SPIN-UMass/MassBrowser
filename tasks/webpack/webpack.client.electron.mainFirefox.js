'use strict'

process.env.BABEL_ENV = 'electron-main'

const path = require('path')
const pkg = require('../../app/package.json')
const webpack = require('webpack')

const common = require('./common')



let config = {
  mode: common.mode,
  devtool: '#source-map',
  entry: {
    main: ["@babel/polyfill", path.join(common.rootDir, 'app/src/client/main/electron/main.js')]
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
    path: path.join(common.rootDir, 'app/dist/client')
  },
  plugins: common.plugins('client', 'electron', 'main',[],true),
  resolve: common.resolve('client'),
  
  target: 'electron-main'
}
console.log(config)

module.exports = config
