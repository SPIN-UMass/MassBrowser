const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const webpack = require('webpack')

const rootDir = path.join(__dirname, '../..')

const rules = [
  {
    test: /\.css$/,
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: 'css-loader'
    })
  },
  {
    test: /\.html$/,
    use: 'vue-html-loader'
  },
  {
    test: /\.js$/,
    use: 'babel-loader',
    include: [ path.resolve(rootDir, 'app/src') ],
    exclude: [/node_modules/]
  },
  {
    test: /\.json$/,
    use: 'json-loader'
  },
  {
    test: /\.node$/,
    use: 'node-loader'
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
    test: /\.scss$/,
    use: {
      loader: 'sass-loader'
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

const resolve = {
  alias: {
    'components': path.join(rootDir, 'app/src/renderer/components'),
    'renderer': path.join(rootDir, 'app/src/renderer'),
    'styles': path.join(rootDir, 'app/src/app/styles'),
    'assets': path.join(rootDir, 'app/assets'),
    '~': path.join(rootDir, 'app/src/'),
    'package.json': path.join(rootDir, 'app/package.json')
  },
  extensions: ['.js', '.vue', '.json', '.css', '.node', '.scss'],
  modules: [
    path.join(rootDir, 'app/node_modules'),
    path.join(rootDir, 'node_modules')
  ]
}

const plugins = [
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': process.env.NODE_ENV === 'production' 
    ? '"production"' 
    : '"development"'
  })
]

module.exports = {
  rootDir,
  rules,
  resolve,
  plugins
}