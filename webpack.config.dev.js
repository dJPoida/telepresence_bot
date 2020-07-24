const merge = require('webpack-merge');
const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const packageJson = require('./package.json');
const baseConfig = require('./webpack.config.base');
const appVersionSuffix = packageJson.version.replace(/\./g, '-');

module.exports = merge.merge(baseConfig, {
  mode: 'development',
  
  // Enable sourcemaps for debugging webpack output.
  devtool: 'source-map',
  
  module: {
    rules: [
      // TS and TSX files
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.dev.json'),
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

      // Compile SCSS to CSS using the MiniCSS Extract Plugin and Hot Loader when in development mode
      {
        test: /\.(scss|css)$/,
        use: [
          'css-hot-loader',
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
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
    ]
  },

  plugins: [
    // Copy the react source files to the dist directory
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
      ],
    }),

    // Use HTML Webpack Plugin to copy and populate our html templates
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', `index.html`),
      filename: `index.html`,
      chunks: ['index'],
      hash: true,
      templateParameters: {
        appTitle: 'Telepresence Bot',
        appVersionSuffix,
        jsSuffix: 'development'
      },
    }),

    // Extract the compiled CSS for each entry point into an external file
    // This makes de-bugging and development easier
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
  ],

  // When running the application in development mode using "yarn dev",
  // the application will be served on localhost using the following config
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    writeToDisk: true,
    port: 80
  }
});
