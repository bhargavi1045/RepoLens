import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { ensureIngested } from '../middleware/ensureIngested';
import { validateFilePath } from '../middleware/validateFilePath';
import {
  explainFile,
  generateArchitecture,
  explainWorkflow,
  generateUnitTests,
  suggestImprovements,
  askRepoController
} from '../controllers/feature.controller';

const router = Router();

const repoOnly = z.object({ repoUrl: z.string().url() });
const repoFile = z.object({ repoUrl: z.string().url(), filePath: z.string().min(1) });
const repoFileOptional = z.object({
  repoUrl: z.string().url(),
  filePath: z.string().optional(),
});

router.post(
  '/explain-file',
  validate(repoFile),
  ensureIngested,
  validateFilePath,
  explainFile
);

router.post(
  '/architecture',
  validate(repoOnly),
  ensureIngested,
  generateArchitecture
);

router.post(
  '/workflow',
  validate(repoOnly),
  ensureIngested,
  explainWorkflow
);

router.post(
  '/unit-tests',
  validate(repoFile),
  ensureIngested,
  validateFilePath,
  generateUnitTests
);

router.post(
  '/improvements',
  validate(repoFileOptional),
  ensureIngested,
  validateFilePath,
  suggestImprovements
);

router.post(
  '/ask-repo', 
  ensureIngested,
  askRepoController
);

export default router;