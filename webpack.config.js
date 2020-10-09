const { default: webpackConfig, paths } = require('./webpack.config.utils')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const pkg = require('./package.json')

module.exports = (env, options) => {
  const { src, dist } = paths()

  return webpackConfig(env, options, {
    entry: { app: src('index.ts') },
    plugins: {
      copy: [],
      html: [
        new HtmlWebpackPlugin({
          inject: true,
          filename: dist('index.html'),
          templateContent: `
            <!DOCTYPE html>
            <html>
              <head><title>${pkg.name} v${pkg.version}</title></head>
              <body>
                <div id="app"></div>
              </body>
            </html>`,
        }),
      ],
    },
  })
}
