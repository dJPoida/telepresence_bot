const merge = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const packageJson = require('./package.json');
const baseConfig = require('./webpack.config.base');
const appVersionSuffix = packageJson.version.replace(/\./g, '-');

module.exports = merge.merge(baseConfig, {
  mode: 'production',

  module: {
    rules: [
      // TS and TSX files
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.prod.json'),
            },
          }
        ]
      },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader'
      },

      // Compile SCSS to CSS using the basic css and sass loaders for production mode
      {
        test: /\.(scss|css)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
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
    ]
  },

  plugins: [
    // Clean the dist directory before performing a production build
    new CleanWebpackPlugin(),

    // Use HTML Webpack Plugin to copy and populate our html templates
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', `${entryPoint.fileName}.html`),
      filename: `index.html`,
      chunks: ['index'],
      hash: true,
      templateParameters: {
        appTitle: 'Telepresence Bot',
        appVersionSuffix,
        jsSuffix: 'production.min'
      },
    }),

    // Extract the compiled CSS for each entry point into an external file
    // This makes de-bugging and development easier
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),    

    // Copy the react source files to the dist directory
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
