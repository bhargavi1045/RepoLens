import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
  };

  return jwt.sign(
    { id: userId },
    config.jwtSecret as string,
    options
  );
};