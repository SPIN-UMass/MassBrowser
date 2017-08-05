'use strict'

process.env.BABEL_ENV = 'electron-renderer'

const path = require('path')
const pkg = require('../../app/package.json')
const webpack = require('webpack')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const common = require('./common')

let config = {
  devtool: '#source-map',
  devServer: { overlay: true },
  entry: {
    renderer: ['babel-polyfill', path.join(common.rootDir, 'app/src/relay/main/electron/renderer.js')]
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    exprContextCritical: false,
    rules: common.rules
  },
  output: {
    filename: 'electron.renderer.js',
    libraryTarget: 'commonjs2',
    path: path.join(common.rootDir, 'app/dist/relay')
  },
  plugins: common.plugins('relay', 'electron', [
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './app/src/common/main/electron/index.ejs',
      appModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(common.rootDir, 'app/node_modules')
        : false,
    }),
    new webpack.LoaderOptionsPlugin({ // Hadi: should it be only in production?
      minimize: true
    })
  ]),
  resolve: common.resolve('relay'),
  target: 'electron-renderer'
}

module.exports = config
