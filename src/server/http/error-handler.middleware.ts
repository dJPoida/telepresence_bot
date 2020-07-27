import { ErrorRequestHandler } from 'express';

export const errorHandlerMiddleware: ErrorRequestHandler = function errorHandlerMiddleware(err, req, res, next) {
  console.error('Express handling error', err);
  if (!res.finished) { res.status(500).json({ message: 'Internal server error', details: err }); }
};
