'use strict'

const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const pkg = require('./package.json')

const resolve = (p) => path.join(__dirname, p)
const srcPath = resolve('src')
const outputPath = resolve('dist')

module.exports = (env, options) => {
  const isProd = options.mode == 'production'

  let config = {
    entry: path.join(srcPath, 'index.js'),
    output: {
      path: outputPath,
      publicPath: '',
      filename: 'bundle.js',
    },
    resolve: {
      symlinks: false,
      extensions: ['.js', '.vue'],
      alias: {
        vue$: 'vue/dist/vue.js',
      },
    },
    module: {
      noParse: /^(vue|vue-router|vuex|lodash)$/,
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: (file) =>
            /node_modules/.test(file) && !/\.vue\.js/.test(file),
        },
        {
          test: /\.(scss|css)$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.pug$/,
          loader: 'pug-plain-loader',
        },
      ],
    },
    plugins: [
      new VueLoaderPlugin(),
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
      contentBase: outputPath,
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
