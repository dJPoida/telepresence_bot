import express from 'express';
import pem from 'pem';
import { ServerOptions } from 'https';
import { resolve } from 'path';

import { configureEnvironment } from './configure-environment';
import { fourZeroFourMiddleware } from './four-zero-four.middleware';
import { errorHandlerMiddleware } from './error-handler.middleware';
import { env } from '../env';

/**
* @description
* Create an express server to handle requests
*/
export function applyExpressMiddleware(
  expressApp: express.Express,
  credentials: ServerOptions,
): express.Express {
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: false }));

  const { sendFile, exists, serveStaticMiddlewareFactory } = configureEnvironment(expressApp);

  // Serve the client static assets
  expressApp.use('/js/:filename', (req, res, next) => {
    const { filename } = req.params;
    sendFile(res, resolve(__dirname, env.DIST_PATH, `client/js/${filename}`));
  });

  // Serve the client index
  expressApp.get(['/', '/control'], (req, res) => {
    sendFile(res, resolve(__dirname, env.DIST_PATH, 'client/control.html'));
  });

  // Serve the client display
  expressApp.get('/display', (req, res) => {
    sendFile(res, resolve(__dirname, env.DIST_PATH, 'client/display.html'));
  });

  // Serve the client config
  expressApp.get('/config', (req, res) => {
    sendFile(res, resolve(__dirname, env.DIST_PATH, 'client/config.html'));
  });

  // Serve the public certificate
  expressApp.get('/cert', (req, res) => {
    if (credentials.cert) {
      res.setHeader('Content-Description', 'File Transfer');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Content-Disposition', 'attachment; filename="filename.crt"');
      res.setHeader('Content-Type', 'application/x-pem-file');
      res.send(credentials.cert);
      // pem.getPublicKey(credentials.cert as string, (key) => {
      //   console.log(credentials.cert);
      // });
    } else {
      res.status(500).json({ message: 'Certificate not available.' });
    }
  });

  // Custom static assets sender (because dev middleware and express.static don't play well together)
  expressApp.use('/css', serveStaticMiddlewareFactory('css'));
  expressApp.use('/', serveStaticMiddlewareFactory('public'));

  // catch errors in async code and pipe through to Express' error handler
  expressApp.use('/', fourZeroFourMiddleware);

  // Error handling middleware
  expressApp.use(errorHandlerMiddleware);

  return expressApp;
}
