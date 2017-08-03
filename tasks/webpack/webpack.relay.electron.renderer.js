'use strict'

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
    renderer: ['babel-polyfill', path.join(common.rootDir, 'app/src/app/main.js')]
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
  plugins: [
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './app/src/app/index.ejs',
      appModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(common.rootDir, 'app/node_modules')
        : false,
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.LoaderOptionsPlugin({ // Hadi: should it be only in production?
      minimize: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': process.env.NODE_ENV === 'production' 
      ? '"production"' 
      : '"development"'
    })
  ],
  resolve: common.resolve,
  target: 'electron-renderer'
}

module.exports = config
