/* eslint-disable no-param-reassign */
import express from 'express';
import { resolve, join } from 'path';
import { wait } from '../../shared/helpers/wait.helper';
import { env } from '../env';
import { ContextLogger } from '../helpers/context-logger.helper';

/**
 * @description
 * Initialise webpack to compile and serve the client in development mode
 *
 * @note: the `require()` statements are intentionally localised to prevent import in production builds
 */
export function applyWebpackDevelopmentMiddleware(
  expressApp: express.Express,
) {
  const log = new ContextLogger('applyWebpackDevelopmentMiddleware()');
  log.info('Enabling webpack for client compilation');

  // eslint-disable-next-line import/no-extraneous-dependencies, node/no-unpublished-require, global-require, @typescript-eslint/no-var-requires
  const webpack = require('webpack');

  // eslint-disable-next-line import/no-extraneous-dependencies, node/no-unpublished-require, global-require, @typescript-eslint/no-var-requires
  const webpackDevMiddleware = require('webpack-dev-middleware');

  // eslint-disable-next-line import/no-extraneous-dependencies, import/no-dynamic-require, node/no-unpublished-require, global-require, @typescript-eslint/no-var-requires
  const webpackConfig = require(resolve(__dirname, env.SOURCE_PATH, '../webpack.config.dev'));

  const compiler = webpack(webpackConfig);

  // Attach the WebpackDevMiddleware to the express server
  expressApp.use(webpackDevMiddleware(compiler, {
    contentBase: [
      resolve(__dirname, env.DIST_PATH, 'client/public'),
    ],
    host: process.env.HOST,
    port: process.env.DEV_CLIENT_PORT,
    watchContentBase: true,
    methods: [],
    logLevel: 'warn',
  }));

  // Assume the first time that the server is run that the webpack bundle is not available
  expressApp.developmentEnvironmentCompiling = true;

  // Keep track of when webpack is compiling so that we don't attempt to serve assets that haven't been created
  compiler.hooks.watchRun.tap('onBeforeRun', (params: any) => {
    expressApp.developmentEnvironmentCompiling = true;
  });
  compiler.hooks.done.tap('onWebpackDone', (params: any) => {
    expressApp.developmentEnvironmentCompiling = false;
  });

  // Attach some middleware that holds incoming request until webpack has compiled
  expressApp.use(async (req, res, next) => {
    if (expressApp.developmentEnvironmentCompiling) {
      log.info(`Holding incoming request "${req.url}" while compiling webpack...`);
      while (expressApp.developmentEnvironmentCompiling) {
        await wait(100);
      }
      log.info(`Releasing held request "${req.url}" now that webpack is compiled.`);
    }
    next();
  });

  // Attach the hot middleware to the compiler & the server
  // eslint-disable-next-line import/no-extraneous-dependencies, node/no-unpublished-require, global-require, @typescript-eslint/no-var-requires
  expressApp.use(require('webpack-hot-middleware')(
    compiler, {
      log: console.log,
      path: '/__webpack_hmr',
      heartbeat: 2 * 1000,
    },
  ));

  return compiler.outputFileSystem;
}
