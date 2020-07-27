import express from 'express';
import http from 'http';

import { env } from './env';

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
  

    // Server running
    console.log('Server Running...');
    httpServer.listen(env.PORT, () => console.info(`Http server running on port ${env.PORT}`));
}

run();
