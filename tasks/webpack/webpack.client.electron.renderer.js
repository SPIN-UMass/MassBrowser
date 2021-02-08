'use strict'

process.env.BABEL_ENV = 'electron-renderer'

const path = require('path')
const pkg = require('../../app/package.json')
const webpack = require('webpack')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const common = require('./common')

let config = {
  mode: common.mode,
  devtool: '#source-map',
  devServer: { overlay: true },
  entry: {
    renderer: ["@babel/polyfill", path.join(common.rootDir, 'app/src/client/main/electron/renderer.js')]
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    exprContextCritical: false,
    rules: common.rules
  },
  output: {
    filename: 'electron.renderer.js',
    libraryTarget: 'commonjs2',
    path: path.join(common.rootDir, 'app/dist/client')
  },
  plugins: common.plugins('client', 'electron', 'renderer', [
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
  resolve: common.resolve('client'),
  target: 'electron-renderer'
}

module.exports = config
