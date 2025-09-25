import express from 'express';
import AuthController from '../controllers/authController.js';
import {
    validateRequest,
    signupSchema,
    loginSchema,
} from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post(
    '/signup',
    authLimiter,
    validateRequest(signupSchema),
    AuthController.signup,
);

router.post(
    '/login',
    authLimiter,
    validateRequest(loginSchema),
    AuthController.login,
);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);

router.post('/logout', authenticateToken, AuthController.logout);

export default router;
