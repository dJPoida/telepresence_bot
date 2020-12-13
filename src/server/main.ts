/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import http from 'http';
import https, { ServerOptions } from 'https';
import pem from 'pem';
import { Kernel } from './lib/kernel';
import * as REMEMBER_OVERRIDES from '../shared/types/overrides.type';
import { initLogger } from './helpers/logger.helper';
import { ContextLogger } from './helpers/context-logger.helper';

// Logger
initLogger();
const log = new ContextLogger('main.ts');
log.info('Booting...');

// SSL Certificate properties
const certProps = {
  days: 365,
  selfSigned: true,
};

pem.createCertificate(certProps, (error, keys) => {
  if (error) {
    throw error;
  }

  const credentials = { key: keys.serviceKey, cert: keys.certificate } as ServerOptions;

  // Express app
  const expressApp = express();

  // http server
  const httpServer = https.createServer(credentials, function handleConnection(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    expressApp(req, res);
  });

  // eslint-disable-next-line no-unused-vars
  const kernel = new Kernel(expressApp, httpServer, credentials);
});
