import express from 'express';
import SendFileFn from 

export function configureEnvironment(expressApp: express.Express): {
    sendFile: SendFileFn,
    writeFile: WriteFileFn,
    exists: ExistsFn,
    serveStaticMiddlewareFactory: ServeStaticMiddlewareFactoryFn,
    requiresAuthMiddlewareFactory: RequiresAuthMiddlewareFactoryFn,
  } {
    // Build and serve the client using webPack in development mode
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    let sendFile: SendFileFn = function sendFileProd(res, filePath, ct = 'text/html') { res.sendFile(filePath); };
    let writeFile: WriteFileFn = async function writeFileProd(filePath, data, options) {
      // Create the path
      let directoryExists = false;
      try {
        const fsStat = await fs.stat(dirname(filePath as string));
        directoryExists = fsStat.isDirectory();
      } catch {
        // Directory does not exist
      }
      if (!directoryExists) {
        await fs.mkdir(dirname(filePath as string));
      }
      await fs.writeFile(filePath, data, options);
    };
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
      writeFile = async function writeFileDev(filePath, data, options) {
        // Create the path
        let directoryExists = false;
        try {
          const fsStat = devFileSystem.statSync(dirname(filePath as string));
          directoryExists = fsStat.isDirectory();
        } catch {
          // Directory does not exist
        }
        if (!directoryExists) {
          devFileSystem.mkdirSync(dirname(filePath as string), { recursive: true });
        }
        devFileSystem.writeFileSync(filePath, data, options);
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
        const realPath = resolve(__dirname, '../../../../../dist/client', join(staticPath, req.path));
        try {
          const fileExists = await exists(realPath);
          if (fileExists) {
            req.shouldLog = false;
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
    };
  
    const requiresAuthMiddlewareFactory = createRequiresAuthMiddlewareFactory(sendFile);
  
    return {
      sendFile,
      writeFile,
      exists,
      serveStaticMiddlewareFactory,
      requiresAuthMiddlewareFactory,
    };
  }