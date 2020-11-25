/* eslint-disable node/no-unpublished-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const dotenv = require('dotenv');
const packageJson = require('./package.json');

const clientSourcePath = path.resolve(__dirname, 'src/client');
const clientDistPath = path.resolve(__dirname, 'dist/client');

dotenv.config();

module.exports = {
  output: {
    path: clientDistPath,
    publicPath: '/',
    filename: 'js/[name].dist.js',
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  plugins: [
    // Provide some global variables to the client
    new webpack.DefinePlugin({
      // Put: 'client side variables here'
      __VERSION__: JSON.stringify(packageJson.version),
      // __CLIENT_KEY__: JSON.stringify(env.CLIENT_KEY), // TODO: remove and implement proper auth
      __CLIENT_KEY__: JSON.stringify(process.env.CLIENT_KEY), // TODO: remove and implement proper auth
    }),

    // Copy other static assets to our dist folder
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(clientSourcePath, 'public'),
          to: path.join(clientDistPath, 'public'),
          toType: 'dir',
        },
      ],
    }),
  ],

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};
