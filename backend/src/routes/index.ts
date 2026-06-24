import { Router } from 'express';
import healthRoutes from './healthRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/upload', uploadRoutes);

export default router;
