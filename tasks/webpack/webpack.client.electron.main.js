'use strict'

const path = require('path')
const pkg = require('../../app/package.json')
const webpack = require('webpack')

const common = require('./common')

let config = {
  devtool: '#source-map',
  entry: {
    main: ['babel-polyfill', path.join(common.rootDir, 'app/src/app/main/index.js')]
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
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': process.env.NODE_ENV === 'production' 
      ? '"production"' 
      : '"development"'
    })
  ],
  resolve: common.resolve,
  target: 'electron-main'
}


module.exports = config
