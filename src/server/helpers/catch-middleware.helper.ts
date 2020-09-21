import { AsyncMiddleware } from '../types/async-middleware.type';

/**
* @description
* Wrap async Express middleware so errors are passed on to the NextFunction properly
*
* Without it, async errors are not piped to the error handling middleware properly (causes 500'd requests to hang)
*
* @param middleware
*/
export function catchMiddleware(middleware: AsyncMiddleware): AsyncMiddleware {
  const doCatchMiddleware: AsyncMiddleware = async function doCatchMiddleware(req, res, next) {
    try {
      const result = await middleware(req, res, next);
      return result;
    } catch (error) {
      // pass error to the error handler middleware
      return next(error);
    }
  };

  return doCatchMiddleware;
}
