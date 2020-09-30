'use strict'

process.env.BABEL_ENV = 'web'

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const common = require('./common')

const rootPath = path.join(common.rootDir, 'app/src/client/web')
const pkg = require(path.join(rootPath, 'package.json'))

let webConfig = {
  mode: common.mode,
  devtool: '#source-map',
  devServer: {
    overlay: true,
    historyApiFallback: true, // is it enabled ?
  },
  entry: {
    script: path.join(rootPath, 'script.js')
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    exprContextCritical: false,
    rules: [
      {
        test: /\.css$/i,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      {
        test:  /\.js$/,
        include: [ path.resolve(common.rootDir, 'app/src') ],
        exclude:  /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
    
          options: {
            
            sourceType: 'unambiguous',
            presets: [['@babel/preset-env',{
              debug: true,
              loose: true,
              modules: 'commonjs',
              shippedProposals: true,
              targets: false,
            }]],
            plugins: ["@babel/plugin-syntax-dynamic-import"]
          }
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
      {
        test: /\.pug$/,
        oneOf: [
          // this applies to `<template lang="pug">` in Vue components
          {
            resourceQuery: /^\?vue/,
            use: ['pug-plain-loader']
          },
          // this applies to pug imports inside JavaScript
          {
            use: ['raw-loader', 'pug-plain-loader']
          }
        ]
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg|pdf)$/,
        use: {
          loader: 'url-loader',
          options: {
            esModule: false,
            limit: 10000,
            name: 'imgs/[name].[ext]'
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            esModule: false,
            limit: 10000,
            name: 'fonts/[name].[ext]'
          }
        }
      }
    ]
  },
  plugins: [
    //new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({
      minify: false,
      filename: 'index.html',
      template: path.join(rootPath, 'index.pug'),
      appModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(rootPath, 'node_modules')
        : false,
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new VueLoaderPlugin()
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'umd',
    path: path.join(common.rootDir, 'app/dist/web')
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.css', '.node', '.scss', '.pug'],
    modules: [
      path.join(rootPath, 'node_modules'),
      path.join(common.rootDir, 'node_modules')
    ]
  },
  target: 'web'
  
}

module.exports = webConfig
