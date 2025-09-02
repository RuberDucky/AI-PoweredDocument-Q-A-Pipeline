import fs from 'fs/promises';
import path from 'path';

// Create necessary directories
const createDirectories = async () => {
    const directories = ['logs', 'uploads/temp', 'data/documents'];

    for (const dir of directories) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`Error creating directory ${dir}:`, error);
            }
        }
    }
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate random string
const generateRandomString = (length = 32) => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Clean text content
const cleanText = (text) => {
    return text
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/[^\w\s.,!?;:()\-]/g, '') // Remove special characters except basic punctuation
        .trim();
};

// Validate environment variables
const validateEnvVars = () => {
    const required = [
        'JWT_SECRET',
        'ANTHROPIC_API_KEY',
        'PINECONE_API_KEY',
        'PINECONE_INDEX_NAME',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`,
        );
    }
};

// Sleep utility
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export {
    createDirectories,
    formatFileSize,
    generateRandomString,
    cleanText,
    validateEnvVars,
    sleep,
};
