import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FirebaseConfig {
    constructor() {
        this.app = null;
        this.auth = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            if (this.initialized) {
                return this.app;
            }

            // Path to the service account key file
            const serviceAccountPath = path.join(
                __dirname,
                '../serviceAccount/documind-778a7-firebase-adminsdk-fbsvc-4e8dfd25a7.json',
            );

            // Check if service account file exists
            if (!fs.existsSync(serviceAccountPath)) {
                throw new Error(
                    `Firebase service account file not found at: ${serviceAccountPath}`,
                );
            }

            // Read and parse the service account file
            const serviceAccount = JSON.parse(
                fs.readFileSync(serviceAccountPath, 'utf8'),
            );

            // Initialize Firebase Admin SDK
            this.app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id,
            });

            this.auth = admin.auth();
            this.initialized = true;

            logger.info('Firebase Admin SDK initialized successfully', {
                projectId: serviceAccount.project_id,
                service: 'firebase',
            });

            return this.app;
        } catch (error) {
            logger.error('Failed to initialize Firebase Admin SDK:', error);
            throw error;
        }
    }

    getAuth() {
        if (!this.initialized) {
            throw new Error(
                'Firebase not initialized. Call initialize() first.',
            );
        }
        return this.auth;
    }

    async verifyIdToken(idToken) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const decodedToken = await this.auth.verifyIdToken(idToken);
            return decodedToken;
        } catch (error) {
            logger.error('Error verifying Firebase ID token:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const userRecord = await this.auth.getUserByEmail(email);
            return userRecord;
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return null;
            }
            logger.error('Error getting user by email from Firebase:', error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const userRecord = await this.auth.createUser(userData);
            return userRecord;
        } catch (error) {
            logger.error('Error creating user in Firebase:', error);
            throw error;
        }
    }

    async deleteUser(uid) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            await this.auth.deleteUser(uid);
            logger.info(`Successfully deleted Firebase user: ${uid}`);
        } catch (error) {
            logger.error('Error deleting user from Firebase:', error);
            throw error;
        }
    }
}

export default new FirebaseConfig();
