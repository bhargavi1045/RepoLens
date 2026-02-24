import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: { id: string };
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Not authorized, no token', 401));
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };

    req.user = { id: decoded.id };

    next();
  } catch (error) {
    next(new AppError('Not authorized, token failed', 401));
  }
};