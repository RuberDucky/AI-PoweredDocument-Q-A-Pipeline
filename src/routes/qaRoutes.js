import express from 'express';
import QAController from '../controllers/qaController.js';
import { authenticateToken } from '../middleware/auth.js';
import {
    validateRequest,
    questionSchema,
    feedbackSchema,
} from '../middleware/validation.js';
import { qaLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Q&A routes
router.post(
    '/ask',
    qaLimiter,
    validateRequest(questionSchema),
    QAController.askQuestion,
);

router.get('/history', QAController.getQAHistory);

router.get('/analytics', QAController.getAnalytics);

router.get('/sessions/:id', QAController.getSessionById);

router.post(
    '/sessions/:id/feedback',
    validateRequest(feedbackSchema),
    QAController.submitFeedback,
);

export default router;
