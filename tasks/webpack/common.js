const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const path = require('path')
const webpack = require('webpack')

const rootDir = path.join(__dirname, '../..')

const rules = [
  {
    test: /\.css$/,
    use: [
      'vue-style-loader',
      'css-loader'
    ]
  },
  {
    test: /\.html$/,
    use: 'vue-html-loader'
  },
  {
    test:  /\.js$/,
    include: [ path.resolve(rootDir, 'app/src') ],
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
    test: /\.node$/,
    use: 'node-loader'
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

const resolve = (target) => {
  return {
    alias: {
      '@': path.join(rootDir, `app/src/${target}`),
      '@common': path.join(rootDir, 'app/src/common'),
      'styles': path.join(rootDir, 'app/src/app/styles'),
      '@assets': path.join(rootDir, 'app/assets'),
      '@utils': path.join(rootDir, 'app/src/utils'),
      '~': path.join(rootDir, 'app/src/'),
      'package.json': path.join(rootDir, 'app/package.json')
    },
    extensions: ['.js', '.vue', '.json', '.css', '.node', '.scss'],
    modules: [
      path.join(rootDir, 'app/node_modules'),
      path.join(rootDir, 'node_modules')
    ]
  }
}

const plugins = (role, interface, electronProcess, otherPlugins, isFirefox=false) => {
  return [
    new VueLoaderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': process.env.NODE_ENV === 'production'
        ? '"production"'
        : '"development"',
      'process.env.IS_FIREFOX': isFirefox ? '"YES"' : '"NO"',
      'process.env.ROLE': `"${role}"`,
      'process.env.APP_INTERFACE': `"${interface}"`,
      'process.env.ELECTRON_PROCESS': `"${electronProcess}"`
    })
  ].concat(otherPlugins || [])}

  const mode =   process.env.NODE_ENV === 'production' ? 'production' : 'development'
  


module.exports = {
  rootDir,
  rules,
  mode,
  resolve,
  plugins
}
