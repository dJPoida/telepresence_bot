import { ErrorRequestHandler } from 'express';
import { ContextLogger } from '../helpers/context-logger.helper';

export const errorHandlerMiddleware: ErrorRequestHandler = function errorHandlerMiddleware(err, req, res, next) {
  const log = new ContextLogger('errorHandlerMiddleware()');
  log.error('Express handling error', err);
  if (!res.finished) { res.status(500).json({ message: 'Internal server error', details: err }); }
};
