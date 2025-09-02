import express from 'express';
import authRoutes from './authRoutes.js';
import documentRoutes from './documentRoutes.js';
import qaRoutes from './qaRoutes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/qa', qaRoutes);

export default router;
