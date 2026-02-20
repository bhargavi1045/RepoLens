import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { getRepoFiles } from '../controllers/repo.controller';
import { ingestRepoController } from '../controllers/feature.controller';

const router = Router();

const repoSchema = z.object({ repoUrl: z.string().url() });

const ingestSchema = z.object({
  repoUrl: z.string().url(),
  force: z.boolean().optional().default(false),
});

router.post('/files', validate(repoSchema), getRepoFiles);
router.post('/ingest', validate(ingestSchema), ingestRepoController);

export default router;