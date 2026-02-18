import { Router } from 'express';
import analysisRoutes from './analysis.routes';
import repoRoutes from './repo.routes';
import featuresRoutes from '../routes/feature.routes';

const router = Router();

router.use('/analysis', analysisRoutes);
router.use('/repo', repoRoutes);
router.use('/features', featuresRoutes);

export default router;