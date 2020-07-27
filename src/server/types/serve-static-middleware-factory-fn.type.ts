import { AsyncMiddleware } from './async-middleware.type';

export interface ServeStaticMiddlewareFactoryFn {
  (staticPath: string): AsyncMiddleware,
}
