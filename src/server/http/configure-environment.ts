import express from 'express';
import { access, constants } from 'fs';
import { lookup } from 'mime-types';
import { SendFileFn } from '../types/send-file-fn.type';
import { catchMiddleware } from '../helpers/catch-middleware.helper';
import { ExistsFn } from '../types/exists-fn.type';
import { ServeStaticMiddlewareFactoryFn } from '../types/serve-static-middleware-factory.type';
import { join, resolve } from 'path';
import { Middleware } from '../types/middleware.type';
import { applyWebpackDevelopmentMiddleware } from './apply-webpack-development.middleware';
import { AsyncMiddleware } from '../types/async-middleware.type';
import { env } from '../env';

export function configureEnvironment(expressApp: express.Express): {
    sendFile: SendFileFn,
    exists: ExistsFn,
    serveStaticMiddlewareFactory: ServeStaticMiddlewareFactoryFn,
  } {
    // Build and serve the client using webPack in development mode
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    let sendFile: SendFileFn = function sendFileProd(res, filePath, ct = 'text/html') { res.sendFile(filePath); };
    let exists: ExistsFn = (filePath: string) => new Promise<boolean>((res) => {
      access(filePath, constants.F_OK, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          res(false);
        } else {
          res(true);
        }
      });
    });
  
    if (!env.IS_PRODUCTION && env.USE_WEBPACK) {
      const devFileSystem = applyWebpackDevelopmentMiddleware(expressApp);
      sendFile = function sendFileDev(res: express.Response, filePath: string, ct = 'text/html') {
        res.set('Content-Type', ct).send(devFileSystem.readFileSync(filePath));
      };
      exists = (filePath: string) => new Promise<boolean>((res) => {
        if (devFileSystem.existsSync(filePath)) {
          res(true);
        } else {
          res(false);
        }
      });
    }
  
  
    /**
     * @description
     * Use this instead of the express.static middleware because express.static doesn't have
     * access to the memory file system that webpack dev server compiles the bundle to.
     *
     * @param staticPath
     */
    const serveStaticMiddlewareFactory: ServeStaticMiddlewareFactoryFn = function serveStaticMiddleware(staticPath: string): Middleware {
      const doServeStatic: Middleware = catchMiddleware(async function doServeStatic(req, res, next) {
        const realPath = resolve(__dirname, env.DIST_PATH, 'client', join(staticPath, req.path));
        try {
          const fileExists = await exists(realPath);
          if (fileExists) {
            sendFile(res, realPath, lookup(realPath) || undefined);
          } else {
            next();
          }
        } catch (e) {
          // If for any reason something goes wrong accessing the file, bump it through to the 404 middleware
          next();
        }
      });
      
      return doServeStatic;
    }
  
    return {
      sendFile,
      exists,
      serveStaticMiddlewareFactory,
    };
  }