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
        fileSize: 25 * 1024 * 1024, // 25MB (increased for PDF/DOCX)
        files: 1,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/plain', // TXT files
            'application/pdf', // PDF files
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX files
            'application/json', // JSON files
            'text/json', // JSON files (alternative MIME type)
        ];

        // Also allow files based on extension for cases where MIME type might not be detected correctly
        const fileExtension = file.originalname.toLowerCase().split('.').pop();
        const allowedExtensions = ['txt', 'pdf', 'docx', 'json'];

        if (
            allowedTypes.includes(file.mimetype) ||
            allowedExtensions.includes(fileExtension)
        ) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    `Invalid file type. Supported formats: PDF, DOCX, TXT, JSON. Received: ${file.mimetype}`,
                ),
            );
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
