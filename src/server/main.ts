import express from 'express';
import http from 'http';
import { Kernel } from './lib/kernel';
import * as REMEMBER_OVERRIDES from '../shared/types/overrides.type';

// Express app
const expressApp = express();

// http server
const httpServer = http.createServer(function handleConnection(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  expressApp(req, res);
});

// eslint-disable-next-line no-unused-vars
const kernel = new Kernel(expressApp, httpServer);
