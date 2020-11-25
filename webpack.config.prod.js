/* eslint-disable node/no-unpublished-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const wpMerge = require('webpack-merge');

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const packageJson = require('./package.json');
const entryPoints = require('./webpack.entrypoints');
const baseConfig = require('./webpack.config.base');

const clientSourcePath = path.resolve(__dirname, 'src/client');
const clientDistPath = path.resolve(__dirname, 'dist/client');
const tsConfigPath = path.resolve(__dirname, 'tsconfig.client.prod.json');

const appVersionSuffix = packageJson.version.replace(/\./g, '-');

const entry = (() => {
  const result = {};

  entryPoints.forEach((entryPoint) => {
    result[entryPoint.name] = [
      path.resolve(clientSourcePath, `${entryPoint.name}.tsx`),
    ];
  });
  return result;
})();

module.exports = wpMerge.merge(baseConfig, {
  mode: 'production',
  entry,
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          configFile: tsConfigPath,
        },
      },
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
              url: false,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: false,
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
        jsSuffix: 'production.min',
      },
    })),

    // Clean the dist directory before performing a production build
    new CleanWebpackPlugin(),

    // Extract the compiled CSS for each entry point into an external file
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),

    // Copy other static assets to our dist folder
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/react/umd', 'react.production.min.js'),
          to: 'js',
          toType: 'dir',
        },
        {
          from: path.resolve(__dirname, 'node_modules/react-dom/umd', 'react-dom.production.min.js'),
          to: 'js',
          toType: 'dir',
        },
      ],
    }),
  ],
});
