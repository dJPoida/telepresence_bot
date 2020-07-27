import Express = require('express');

declare global {
  namespace Express {
    interface Application {
      developmentEnvironmentCompiling: boolean,
    }
  }
}
