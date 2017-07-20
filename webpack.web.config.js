'use strict'

process.env.BABEL_ENV = 'web'

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const rootPath = path.join(__dirname, './app/src/client/web')

const pkg = require(path.join(rootPath, 'package.json'))

let webConfig = {
  devtool: '#source-map',
  devServer: { overlay: true },
  entry: {
    script: path.join(rootPath, 'script.js')
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    exprContextCritical: false,
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.json$/,
        use: 'json-loader'
      },
      {
        test: /\.scss$/,
        use: {
          loader: 'sass-loader'
        }
      },
      {
        test: /\.pug$/,
        use: {
          loader: 'pug-loader'
        }
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            loaders: {
              sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
              scss: 'vue-style-loader!css-loader!sass-loader'
            }
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name].[ext]'
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name].[ext]'
          }
        }
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({
      minify: false,
      filename: 'index.html',
      template: path.join(rootPath, 'index.pug'),
      appModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(rootPath, 'node_modules')
        : false,
    }),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'umd',
    path: path.join(__dirname, 'app/dist/web')
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.css', '.node', '.scss', '.pug'],
    modules: [
      path.join(rootPath, 'node_modules'),
      path.join(__dirname, 'node_modules')
    ]
  },
  target: 'web'
}

module.exports = webConfig
