import documentService from '../services/documentService.js';
import logger from '../config/logger.js';

class DocumentController {
    static async uploadDocument(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                });
            }

            const document = await documentService.uploadDocument(
                req.file,
                req.user.id,
            );

            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                data: { document },
            });
        } catch (error) {
            logger.error('Upload document controller error:', error);

            if (
                error.message.includes('File too large') ||
                error.message.includes('Unsupported file type') ||
                error.message.includes('No file provided')
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }

    static async getDocuments(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await documentService.getDocuments(
                req.user.id,
                page,
                limit,
            );

            res.status(200).json({
                success: true,
                message: 'Documents retrieved successfully',
                data: result,
            });
        } catch (error) {
            logger.error('Get documents controller error:', error);
            next(error);
        }
    }

    static async getDocumentById(req, res, next) {
        try {
            const { id } = req.params;
            const document = await documentService.getDocumentById(
                id,
                req.user.id,
            );

            res.status(200).json({
                success: true,
                message: 'Document retrieved successfully',
                data: { document },
            });
        } catch (error) {
            logger.error('Get document by ID controller error:', error);

            if (error.message === 'Document not found or access denied') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }

    static async deleteDocument(req, res, next) {
        try {
            const { id } = req.params;
            const result = await documentService.deleteDocument(
                id,
                req.user.id,
            );

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            logger.error('Delete document controller error:', error);

            if (error.message === 'Document not found or access denied') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }

    static async reprocessDocument(req, res, next) {
        try {
            const { id } = req.params;
            const result = await documentService.reprocessDocument(
                id,
                req.user.id,
            );

            res.status(200).json({
                success: true,
                message: result.message,
                data: { chunkCount: result.chunkCount },
            });
        } catch (error) {
            logger.error('Reprocess document controller error:', error);

            if (error.message === 'Document not found or access denied') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }
}

export default DocumentController;
