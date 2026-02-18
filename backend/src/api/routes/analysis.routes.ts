import { Router } from 'express';
import { z } from 'zod';
import { analyzeRepo } from '../controllers/analysis.controller';
import { validate } from '../middleware/validate';
import { analyzeLimiter } from '../middleware/rateLimiter';

const router = Router();

const analyzeSchema = z.object({
  repoUrl: z.string().url({ message: 'repoUrl must be a valid URL' }),
});

router.post('/analyze', analyzeLimiter, validate(analyzeSchema), analyzeRepo);

export default router;