import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { Document } from '../models/index.js';
import pineconeService from './pineconeService.js';
import aiService from './claudeService.js';
import logger from '../config/logger.js';

class DocumentService {
    constructor() {
        this.allowedFileTypes = ['txt', 'pdf', 'docx', 'json'];
        this.maxFileSize = 25 * 1024 * 1024; // 25MB (increased for PDF/DOCX)
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
                    userId: document.uploadedBy, // Pass user ID for isolation
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

        try {
            switch (fileExtension) {
                case 'txt':
                    return file.buffer.toString('utf-8');

                case 'pdf':
                    const pdfData = await pdfParse(file.buffer);
                    if (!pdfData.text || pdfData.text.trim().length === 0) {
                        throw new Error(
                            'PDF contains no extractable text content',
                        );
                    }
                    return pdfData.text;

                case 'docx':
                    const docxResult = await mammoth.extractRawText({
                        buffer: file.buffer,
                    });
                    if (
                        !docxResult.value ||
                        docxResult.value.trim().length === 0
                    ) {
                        throw new Error(
                            'DOCX contains no extractable text content',
                        );
                    }
                    // Log any conversion messages/warnings
                    if (docxResult.messages && docxResult.messages.length > 0) {
                        logger.warn(
                            'DOCX conversion messages:',
                            docxResult.messages,
                        );
                    }
                    return docxResult.value;

                case 'json':
                    const jsonText = file.buffer.toString('utf-8');
                    try {
                        const jsonData = JSON.parse(jsonText);
                        // Convert JSON to readable text format
                        return this.jsonToReadableText(jsonData);
                    } catch (jsonError) {
                        throw new Error(
                            `Invalid JSON format: ${jsonError.message}`,
                        );
                    }

                default:
                    throw new Error(
                        `Unsupported file type: ${fileExtension}. Supported types: ${this.allowedFileTypes.join(
                            ', ',
                        )}`,
                    );
            }
        } catch (error) {
            logger.error(
                `Error extracting text from ${fileExtension} file:`,
                error,
            );
            throw error;
        }
    }

    validateFile(file) {
        if (!file) {
            return { isValid: false, message: 'No file provided' };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                message: `File too large. Maximum size is ${
                    this.maxFileSize / 1024 / 1024
                }MB`,
            };
        }

        // Check minimum file size
        if (file.size < 10) {
            return {
                isValid: false,
                message: 'File is too small or empty',
            };
        }

        // Check file extension
        const fileExtension = path
            .extname(file.originalname)
            .slice(1)
            .toLowerCase();

        if (!this.allowedFileTypes.includes(fileExtension)) {
            return {
                isValid: false,
                message: `Unsupported file type '${fileExtension}'. Supported types: ${this.allowedFileTypes
                    .join(', ')
                    .toUpperCase()}`,
            };
        }

        // Additional validation by file type
        switch (fileExtension) {
            case 'pdf':
                if (
                    !file.buffer ||
                    file.buffer[0] !== 0x25 ||
                    file.buffer[1] !== 0x50
                ) {
                    return {
                        isValid: false,
                        message: 'Invalid PDF file format',
                    };
                }
                break;

            case 'docx':
                // Basic DOCX validation (ZIP file signature)
                if (
                    !file.buffer ||
                    file.buffer[0] !== 0x50 ||
                    file.buffer[1] !== 0x4b
                ) {
                    return {
                        isValid: false,
                        message: 'Invalid DOCX file format',
                    };
                }
                break;

            case 'json':
                try {
                    JSON.parse(file.buffer.toString('utf-8'));
                } catch (error) {
                    return { isValid: false, message: 'Invalid JSON format' };
                }
                break;
        }

        return { isValid: true, message: 'File is valid' };
    }

    generateTitle(filename) {
        return path
            .basename(filename, path.extname(filename))
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    jsonToReadableText(jsonData) {
        /**
         * Convert JSON data to readable text format for better searchability
         */
        const convertValue = (value, key = '', depth = 0) => {
            const indent = '  '.repeat(depth);

            if (value === null) return `${key ? key + ': ' : ''}null`;
            if (value === undefined) return `${key ? key + ': ' : ''}undefined`;

            if (typeof value === 'string') {
                return `${key ? key + ': ' : ''}${value}`;
            }

            if (typeof value === 'number' || typeof value === 'boolean') {
                return `${key ? key + ': ' : ''}${value}`;
            }

            if (Array.isArray(value)) {
                if (value.length === 0) return `${key ? key + ': ' : ''}[]`;

                const items = value
                    .map((item, index) => {
                        return `${indent}  - ${convertValue(
                            item,
                            '',
                            depth + 1,
                        )}`;
                    })
                    .join('\n');

                return `${key ? key + ':\n' : ''}${items}`;
            }

            if (typeof value === 'object') {
                const entries = Object.entries(value);
                if (entries.length === 0) return `${key ? key + ': ' : ''}{}`;

                const props = entries
                    .map(([k, v]) => {
                        return `${indent}  ${convertValue(v, k, depth + 1)}`;
                    })
                    .join('\n');

                return `${key ? key + ':\n' : ''}${props}`;
            }

            return `${key ? key + ': ' : ''}${String(value)}`;
        };

        return convertValue(jsonData);
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
