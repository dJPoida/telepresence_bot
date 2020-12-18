/* eslint-disable node/no-unpublished-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const wpMerge = require('webpack-merge');

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const packageJson = require('./package.json');
const entryPoints = require('./webpack.entrypoints');
const baseConfig = require('./webpack.config.base');

const clientSourcePath = path.resolve(__dirname, 'src/client');
const clientDistPath = path.resolve(__dirname, 'dist/client');
const tsConfigPath = path.resolve(__dirname, 'tsconfig.client.dev.json');

const appVersionSuffix = packageJson.version.replace(/\./g, '-');

const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=1000&reload=true';

const entry = (() => {
  const result = {};

  entryPoints.forEach((entryPoint) => {
    result[entryPoint.name] = [
      path.resolve(clientSourcePath, `${entryPoint.name}.tsx`),
      hotMiddlewareScript,
    ];
  });
  return result;
})();

module.exports = wpMerge.merge(baseConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  entry,
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: tsConfigPath,
            },
          },
        ],
      },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
      {
        test: /\.(scss|css)$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              url: false,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // Use HTML Webpack Plugin to copy and populate our html templates
    ...entryPoints.map((entryPoint) => new HtmlWebpackPlugin({
      template: path.resolve(clientSourcePath, `${entryPoint.template}.html`),
      filename: path.resolve(clientDistPath, `${entryPoint.name}.html`),
      chunks: [entryPoint.name],
      hash: true,
      templateParameters: {
        appTitle: 'Telepresence Bot',
        appVersionSuffix,
        jsSuffix: 'development',
      },
    })),

    new webpack.HotModuleReplacementPlugin(),

    // Copy other static assets to our dist folder
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/react/umd', 'react.development.js'),
          to: 'js',
          toType: 'dir',
        },
        {
          from: path.resolve(__dirname, 'node_modules/react-dom/umd', 'react-dom.development.js'),
          to: 'js',
          toType: 'dir',
        },
        {
          from: path.resolve(__dirname, 'node_modules/peerjs/dist', 'peerjs.js'),
          to: 'js/peerjs.development.js',
          toType: 'file',
        },
        {
          from: path.resolve(__dirname, 'node_modules/peerjs/dist', 'peerjs.js.map'),
          to: 'js/peerjs.js.map',
          toType: 'file',
        },
      ],
    }),
  ],
});
