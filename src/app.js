import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { sequelize } from './models/index.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { createDirectories, validateEnvVars } from './utils/helpers.js';
import pineconeService from './services/pineconeService.js';
import logger from './config/logger.js';

class App {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
    }

    async initialize() {
        try {
            // Validate environment variables
            validateEnvVars();

            // Create necessary directories
            await createDirectories();

            // Setup middleware
            this.setupMiddleware();

            // Setup routes
            this.setupRoutes();

            // Setup error handling
            this.setupErrorHandling();

            // Initialize database
            await this.initializeDatabase();

            // Initialize Pinecone
            await this.initializePinecone();

            logger.info('Application initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize application:', error);
            process.exit(1);
        }
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        scriptSrc: ["'self'"],
                        imgSrc: ["'self'", 'data:', 'https:'],
                    },
                },
            }),
        );

        // CORS
        this.app.use(
            cors({
                origin: process.env.ALLOWED_ORIGINS
                    ? process.env.ALLOWED_ORIGINS.split(',')
                    : '*',
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            }),
        );

        // Rate limiting
        this.app.use(generalLimiter);

        // Request logging
        this.app.use(
            morgan('combined', {
                stream: {
                    write: (message) => logger.info(message.trim()),
                },
            }),
        );

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Trust proxy (for deployment behind reverse proxy)
        this.app.set('trust proxy', 1);
    }

    setupRoutes() {
        // API routes
        this.app.use('/api/v1', routes);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Welcome to Q&A Pipeline API',
                version: '1.0.0',
                documentation: '/api/v1/health',
                endpoints: {
                    auth: '/api/v1/auth',
                    documents: '/api/v1/documents',
                    qa: '/api/v1/qa',
                },
            });
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use(notFound);

        // Global error handler
        this.app.use(errorHandler);

        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception thrown:', error);
            process.exit(1);
        });
    }

    async initializeDatabase() {
        try {
            await sequelize.authenticate();
            await sequelize.sync({
                alter: true,
            });
            logger.info('Database connection established successfully');

            if (process.env.NODE_ENV === 'development') {
                await sequelize.sync({ alter: true });
                logger.info('Database synchronized');
            }
        } catch (error) {
            logger.error('Unable to connect to the database:', error);
            throw error;
        }
    }

    async initializePinecone() {
        try {
            await pineconeService.initialize();
            await pineconeService.createIndex();
            logger.info('Pinecone service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Pinecone service:', error);
            // Don't exit here as the app can still function without Pinecone
            // but log the error for monitoring
        }
    }

    start() {
        const server = this.app.listen(this.port, () => {
            logger.info(`Server is running on port ${this.port}`);
            logger.info(
                `Environment: ${process.env.NODE_ENV || 'development'}`,
            );
            logger.info(
                `API Documentation: http://localhost:${this.port}/api/v1/health`,
            );
        });

        // Graceful shutdown
        const gracefulShutdown = () => {
            logger.info('Received kill signal, shutting down gracefully...');
            server.close(() => {
                logger.info('Closed out remaining connections');
                sequelize.close();
                process.exit(0);
            });

            setTimeout(() => {
                logger.error(
                    'Could not close connections in time, forcefully shutting down',
                );
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        return server;
    }
}

// Initialize and start the application
const app = new App();

if (import.meta.url === `file://${process.argv[1]}`) {
    app.initialize()
        .then(() => {
            app.start();
        })
        .catch((error) => {
            logger.error('Failed to start application:', error);
            process.exit(1);
        });
}

export default app;
