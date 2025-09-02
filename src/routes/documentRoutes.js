import express from 'express';
import multer from 'multer';
import DocumentController from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only TXT files are allowed.'));
        }
    },
});

// All routes require authentication
router.use(authenticateToken);

// Document routes
router.post(
    '/upload',
    upload.single('document'),
    DocumentController.uploadDocument,
);

router.get('/', DocumentController.getDocuments);

router.get('/:id', DocumentController.getDocumentById);

router.delete('/:id', DocumentController.deleteDocument);

router.post('/:id/reprocess', DocumentController.reprocessDocument);

export default router;
