import express from 'express';
import http from 'http';

import { env } from './env';
import * as REMEMBER_OVERRIDES from '../shared/types/overrides.type';
import { applyExpressMiddleware } from './http/apply-express-middleware';

async function run() {
    // Express app
    const expressApp = express();
    
    // http server
    const httpServer = http.createServer(function handleConnection(
        req: http.IncomingMessage,
        res: http.ServerResponse,
      ) {
        expressApp(req, res);
      });
  
    // Apply the routing and middleware to the express app
    applyExpressMiddleware(expressApp);

    // Server running
    console.log('Server Running...');
    httpServer.listen(env.DEFAULT_PORT, () => console.info(`Http server running on port ${env.DEFAULT_PORT}`));
}

run();
