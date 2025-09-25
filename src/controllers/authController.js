import AuthService from '../services/authService.js';
import googleAuthService from '../services/googleAuthService.js';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

class AuthController {
    static async signup(req, res, next) {
        try {
            const result = await AuthService.signup(req.body);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result,
            });
        } catch (error) {
            logger.error('Signup controller error:', error);

            if (error.message === 'User with this email already exists') {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const result = await AuthService.login(req.body);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        } catch (error) {
            logger.error('Login controller error:', error);

            if (
                error.message.includes('Invalid email or password') ||
                error.message.includes('Account is deactivated')
            ) {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }

    static async getProfile(req, res, next) {
        try {
            const user = await AuthService.getProfile(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: { user },
            });
        } catch (error) {
            logger.error('Get profile controller error:', error);
            next(error);
        }
    }

    static async logout(req, res) {
        // Since we're using stateless JWT, logout is handled on the client side
        res.status(200).json({
            success: true,
            message:
                'Logout successful. Please remove the token from client storage.',
        });
    }

    static async googleAuth(req, res, next) {
        try {
            const authUrl = googleAuthService.getGoogleAuthURL();
            
            res.status(200).json({
                success: true,
                message: 'Google OAuth URL generated',
                data: {
                    authUrl: `${req.protocol}://${req.get('host')}${authUrl}`,
                    instructions: 'Open this URL in a popup window for authentication'
                }
            });
        } catch (error) {
            logger.error('Google auth URL generation error:', error);
            next(error);
        }
    }

    static async verifyFirebaseToken(req, res, next) {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Firebase ID token is required'
                });
            }

            // Verify Firebase token and get/create user
            const { user, decodedToken } = await googleAuthService.verifyFirebaseToken(idToken);

            // Generate JWT token for our application
            const token = jwt.sign(
                { 
                    userId: user.id,
                    email: user.email,
                    firebaseUid: decodedToken.uid,
                    authProvider: user.authProvider
                },
                process.env.JWT_SECRET,
                { 
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                    issuer: 'qa-pipeline'
                }
            );

            logger.info(`Firebase auth successful for user: ${user.email}`);

            res.status(200).json({
                success: true,
                message: 'Authentication successful',
                data: {
                    token,
                    user: user.toJSON()
                }
            });

        } catch (error) {
            logger.error('Firebase token verification error:', error);
            
            if (error.message.includes('Invalid Firebase token')) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Firebase token'
                });
            }

            next(error);
        }
    }
}

export default AuthController;
