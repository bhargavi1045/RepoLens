import { Request, Response, NextFunction } from 'express';
import { ChunkModel } from '../../models/Chunk.model';
import { AppError } from './errorHandler';

export const validateFilePath = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl, filePath } = req.body;

    if (!filePath) {
      return next();
    }

    if (filePath.includes('..') || filePath.startsWith('/')) {
      return next(new AppError('Invalid filePath — path traversal not allowed', 400));
    }

    const exists = await ChunkModel.findOne({ repoUrl, filePath });
    if (!exists) {
      return next(
        new AppError(
          `File "${filePath}" not found in ingested repo. Check the path and try again.`,
          404
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};