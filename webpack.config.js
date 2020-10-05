'use strict'

const { join } = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const pkg = require('./package.json')

const resolve = (...args) => join(__dirname, ...args)
const src = (...args) => resolve('src', ...args)
const dist = (...args) => resolve('dist', ...args)

module.exports = (env, options) => {
  const config = {
    entry: {
      app: src('index.js'),
    },

    output: {
      path: dist(),
      filename: 'js/[name].js',
      publicPath: '',
      chunkFilename: 'js/[name].js',
    },

    resolve: {
      extensions: ['.js', '.vue'],
      alias: {
        '@': src(),
        vue$: 'vue/dist/vue.esm-bundler.js',
        // vue$: 'vue/dist/vue.runtime.esm-bundler.js',
      },
    },

    module: {
      noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: (filepath) => /node_modules/.test(filepath),
        },
        {
          test: /\.(scss|css)$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.pug$/,
          loader: 'vue-indent-pug-loader',
        },
      ],
    },

    optimization: {
      splitChunks: {
        cacheGroups: {
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            chunks: 'initial',
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true,
          },
        },
      },
    },

    plugins: [
      new CleanWebpackPlugin({
        verbose: false,
        cleanStaleWebpackAssets: false,
      }),
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
      }),
      new HtmlWebpackPlugin({
        inject: true,
        templateContent: `
          <!DOCTYPE html>
          <html>
            <head><title>${pkg.name} v${pkg.version}</title></head>
            <body>
              <div id="app"></div>
            </body>
          </html>`,
        xhtml: true,
      }),
    ],

    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    devServer: {
      contentBase: dist(),
      compress: true,
      historyApiFallback: true,
      hot: true,
      open: true,
      overlay: true,
      port: 9090,
      stats: 'minimal',
      clientLogLevel: 'warn',
    },
  }

  return config
}
