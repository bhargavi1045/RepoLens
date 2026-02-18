import { Request, Response, NextFunction } from 'express';
import { runAnalysis } from '../../services/analysis.service';

export const analyzeRepo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repoUrl } = req.body;
    const result = await runAnalysis(repoUrl);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};