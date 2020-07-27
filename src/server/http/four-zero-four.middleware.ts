import { Middleware } from '../types/middleware.type';

export const fourZeroFourMiddleware: Middleware = function fourZeroFourMiddleware(req, res) {
  res.status(404).json({ message: 'Not found' });
};
