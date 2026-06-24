import { Router } from 'express';
import { uploadSingle } from '../middleware/upload';
import { uploadFile } from '../controllers/uploadController';

const router = Router();

// Multer runs first: validates extension, enforces size limit, writes to disk.
// If multer rejects the file it calls next(err) and uploadFile is never reached.
router.post('/', uploadSingle, uploadFile);

export default router;
