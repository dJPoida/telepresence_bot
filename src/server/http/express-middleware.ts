import express from 'express';

/**
 * @description
 * Create an express server to handle requests
 */
export function applyExpressMiddleware(
    expressApp: express.Express,
  ) {
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: false }));
  
    const { sendFile, writeFile, exists, serveStaticMiddlewareFactory, requiresAuthMiddlewareFactory } = configureEnvironment(expressApp);
  
    // Trust the proxy if we're hosting on elastic beanstalk or otherwise and
    // we need to know about the client in front of the proxy
    if (env.TRUST_PROXY) { expressApp.enable('trust proxy'); }
  
    /** @description Log incoming requests */
    expressApp.use(logMiddleware);
    expressApp.use('/', authParserMiddleware(providers.sessions));
  
    /** @description Serve the client static assets TODO: auth */
    expressApp.use('/js/:filename', (req, res, next) => {
      const { filename } = req.params;
      // if looking for the login page OR already authenticated as the console, serve the JS file requested
      if (filename.startsWith('login.') || (req.auth.isAuthenticated && req.auth.as === AUTHENTICATED_AS.CONSOLE)) {
        req.shouldLog = false;
        sendFile(res, resolve(__dirname, `../../../../dist/client/js/${filename}`));
      } else {
        next();
      }
    });
  
  
    // login attempts
    expressApp.post(ROUTE.api.routes.login, loginMiddleware(providers.sessions));
    expressApp.post(ROUTE.api.routes.logout, logoutMiddleware(providers.sessions));
  
    /** @description API Endpoints - delegate to the apiRouter */
    expressApp.use(
      [ROUTE.api.root],
      requiresAuthMiddlewareFactory([AUTHENTICATED_AS.CONSOLE], {}),
      apiRouter({ masterProcess, socketServer, providers, sendFile, writeFile, exists }),
    );
  
    /** @description Reporting Endpoints - delegate to the reportRouter */
    expressApp.use(
      [ROUTE.reports.root],
      requiresAuthMiddlewareFactory([AUTHENTICATED_AS.PORTAL, AUTHENTICATED_AS.CONSOLE], {}),
      reportRouter({ masterProcess, socketServer, providers, writeFile, sendFile, exists }),
    );
  
    /** @description Client Endpoints - Serve the react application TODO: auth */
    expressApp.get(
      [
        ROUTE.client.root,
        ...Object.values(ROUTE.client.routes),
        ...Object.values(ROUTE.client.routes).map((r) => `${r}/*`),
      ],
      requiresAuthMiddlewareFactory([AUTHENTICATED_AS.CONSOLE], {}),
      (req, res) => {
        req.shouldLog = false;
        sendFile(res, resolve(__dirname, '../../../../dist/client/console.html'));
      },
    );
  
  
    // Custom static assets sender (because dev middleware and express.static don't play well together)
    expressApp.use('/css', serveStaticMiddlewareFactory('css'));
    expressApp.use('/', serveStaticMiddlewareFactory('public'));
  
  
    /** * @description catch errors in async code and pipe through to Express' error handler */
    expressApp.use('/', fourZeroFourMiddleware);
  
    /** @description Error handling middleware */
    expressApp.use(errorHandlerMiddleware);
  
    return expressApp;
  }