import { Request, Response, NextFunction } from 'express';
import { fetchRepoFiles } from '../../services/github.service';

export const getRepoFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl } = req.body;
    const files = await fetchRepoFiles(repoUrl);
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
};