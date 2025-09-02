import fs from 'fs/promises';
import path from 'path';
import { Document } from '../models/index.js';
import pineconeService from './pineconeService.js';
import claudeService from './claudeService.js';
import logger from '../config/logger.js';

class DocumentService {
    constructor() {
        this.allowedFileTypes = ['txt'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    async uploadDocument(file, userId) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // Extract text content
            const content = await this.extractTextContent(file);

            // Create document record
            const document = await Document.create({
                title: this.generateTitle(file.originalname),
                content,
                originalFileName: file.originalname,
                fileType: path
                    .extname(file.originalname)
                    .slice(1)
                    .toLowerCase(),
                fileSize: file.size,
                uploadedBy: userId,
                isProcessed: false,
            });

            // Process document synchronously
            await this.processDocumentAsync(document);

            logger.info(
                `Document uploaded and processed: ${document.id} by user ${userId}`,
            );

            return document;
        } catch (error) {
            logger.error('Error uploading document:', error);
            throw error;
        }
    }

    // Method to manually process a document (for testing/debugging)
    async reprocessDocument(documentId, userId) {
        try {
            const document = await Document.findOne({
                where: { id: documentId, uploadedBy: userId },
            });

            if (!document) {
                throw new Error('Document not found or access denied');
            }

            logger.info(`Manually reprocessing document: ${documentId}`);
            const chunkCount = await this.processDocumentAsync(document);

            return {
                success: true,
                message: 'Document reprocessed successfully',
                chunkCount,
            };
        } catch (error) {
            logger.error('Error reprocessing document:', error);
            throw error;
        }
    }

    async processDocumentAsync(document) {
        try {
            logger.info(`Starting to process document: ${document.id}`);

            // Ensure Pinecone is initialized
            await pineconeService.initialize();

            // Add to vector database
            const chunkCount = await pineconeService.addDocuments([
                {
                    id: document.id,
                    title: document.title,
                    content: document.content,
                    documentId: document.id,
                },
            ]);

            // Update document status
            await document.update({
                isProcessed: true,
                chunkCount,
                pineconeId: document.id,
            });

            logger.info(
                `Document processed successfully: ${document.id}, chunks: ${chunkCount}`,
            );

            return chunkCount;
        } catch (error) {
            logger.error(`Error processing document ${document.id}:`, {
                error: error.message,
                stack: error.stack,
            });

            // Update document with error status
            try {
                await document.update({
                    isProcessed: false,
                });
            } catch (updateError) {
                logger.error(
                    `Failed to update document status: ${updateError.message}`,
                );
            }

            throw error;
        }
    }

    async extractTextContent(file) {
        const fileExtension = path
            .extname(file.originalname)
            .slice(1)
            .toLowerCase();

        if (fileExtension === 'txt') {
            return file.buffer.toString('utf-8');
        } else {
            throw new Error(
                `Unsupported file type: ${fileExtension}. Only TXT files are supported.`,
            );
        }
    }

    validateFile(file) {
        if (!file) {
            return { isValid: false, message: 'No file provided' };
        }

        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                message: `File too large. Maximum size is ${
                    this.maxFileSize / 1024 / 1024
                }MB`,
            };
        }

        const fileExtension = path
            .extname(file.originalname)
            .slice(1)
            .toLowerCase();
        if (!this.allowedFileTypes.includes(fileExtension)) {
            return {
                isValid: false,
                message: `Unsupported file type. Allowed types: ${this.allowedFileTypes.join(
                    ', ',
                )}`,
            };
        }

        return { isValid: true, message: 'File is valid' };
    }

    generateTitle(filename) {
        return path
            .basename(filename, path.extname(filename))
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    async getDocuments(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await Document.findAndCountAll({
                where: { uploadedBy: userId },
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                attributes: [
                    'id',
                    'title',
                    'originalFileName',
                    'fileType',
                    'fileSize',
                    'isProcessed',
                    'chunkCount',
                    'createdAt',
                ],
            });

            return {
                documents: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit),
                },
            };
        } catch (error) {
            logger.error('Error getting documents:', error);
            throw error;
        }
    }

    async deleteDocument(documentId, userId) {
        try {
            const document = await Document.findOne({
                where: { id: documentId, uploadedBy: userId },
            });

            if (!document) {
                throw new Error('Document not found or access denied');
            }

            // Remove from vector database
            if (document.pineconeId) {
                await pineconeService.deleteDocument(document.pineconeId);
            }

            // Delete document record
            await document.destroy();

            logger.info(`Document deleted: ${documentId} by user ${userId}`);

            return { message: 'Document deleted successfully' };
        } catch (error) {
            logger.error('Error deleting document:', error);
            throw error;
        }
    }

    async getDocumentById(documentId, userId) {
        try {
            const document = await Document.findOne({
                where: { id: documentId, uploadedBy: userId },
            });

            if (!document) {
                throw new Error('Document not found or access denied');
            }

            return document;
        } catch (error) {
            logger.error('Error getting document by ID:', error);
            throw error;
        }
    }
}

export default new DocumentService();
