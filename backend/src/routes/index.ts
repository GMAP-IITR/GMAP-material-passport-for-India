import { Router } from 'express';
import healthRoutes from './healthRoutes';
import uploadRoutes from './uploadRoutes';
import normalizationRoutes from './normalizationRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/upload', uploadRoutes);
router.use('/normalization', normalizationRoutes);

export default router;
