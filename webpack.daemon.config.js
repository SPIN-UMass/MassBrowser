'use strict'

process.env.BABEL_ENV = 'main'

const path = require('path')
const pkg = require('./app/package.json')
const webpack = require('webpack')

let mainConfig = {
  devtool: '#source-map',
  entry: {
    client: path.join(__dirname, 'app/src/client/main.js'),
    relay: path.join(__dirname, 'app/src/relay/main.js'),
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.node$/,
        loader: 'node-loader'
      }
    ]
  },
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'app/dist')
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    })
  ],
  resolve: {
    alias: {
      '~': path.join(__dirname, 'app/src/'),
      'package.json': path.join(__dirname, 'app/package.json')
    },
    extensions: ['.js', '.json', '.node'],
    modules: [
      path.join(__dirname, 'app/node_modules')
    ]
  },
  target: 'electron-main'
}

module.exports = mainConfig
