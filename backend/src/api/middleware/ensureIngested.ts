import { Request, Response, NextFunction } from 'express';
import { RepoModel } from '../../models/Repo.model';
import { AppError } from './errorHandler';

export const ensureIngested = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return next(new AppError('repoUrl is required', 400));
    }

    const repo = await RepoModel.findOne({ repoUrl });

    if (!repo) {
      return next(
        new AppError('Repository not found. Call POST /api/v1/repo/ingest first.', 400)
      );
    }

    if (repo.status === 'pending') {
      return next(new AppError('Repository ingestion is still in progress.', 400));
    }

    if (repo.status === 'failed') {
      return next(
        new AppError('Repository ingestion previously failed. Re-ingest via POST /api/v1/repo/ingest with force=true.', 400)
      );
    }

    if (repo.status !== 'ingested') {
      return next(new AppError('Repository is not ingested.', 400));
    }

    next();
  } catch (error) {
    next(error);
  }
};