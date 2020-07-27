import { Request, Response, NextFunction } from 'express';

export interface AsyncMiddleware {
  (req: Request, res: Response, next: NextFunction): Promise<any>
}
