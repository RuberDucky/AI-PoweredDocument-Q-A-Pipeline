import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import googleAuthService from '../services/googleAuthService.js';
import logger from '../config/logger.js';

const router = express.Router();

// Google OAuth login route
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);

// Google OAuth callback route
router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(400).send(`
                    <html>
                        <body>
                            <script>
                                window.opener.postMessage({ 
                                    success: false, 
                                    error: 'Authentication failed' 
                                }, '*');
                                window.close();
                            </script>
                        </body>
                    </html>
                `);
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user.id,
                    email: user.email,
                    authProvider: user.authProvider
                },
                process.env.JWT_SECRET,
                { 
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                    issuer: 'qa-pipeline'
                }
            );

            logger.info(`Google OAuth successful for user: ${user.email}`);

            // Send success message to parent window and close popup
            res.send(`
                <html>
                    <body>
                        <script>
                            window.opener.postMessage({ 
                                success: true, 
                                token: '${token}',
                                user: ${JSON.stringify(user.toJSON())}
                            }, '*');
                            window.close();
                        </script>
                    </body>
                </html>
            `);

        } catch (error) {
            logger.error('Error in Google OAuth callback:', error);
            
            res.status(500).send(`
                <html>
                    <body>
                        <script>
                            window.opener.postMessage({ 
                                success: false, 
                                error: 'Authentication failed' 
                            }, '*');
                            window.close();
                        </script>
                    </body>
                </html>
            `);
        }
    }
);

// Firebase token verification route
router.post('/firebase/verify', async (req, res) => {
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
        logger.error('Error verifying Firebase token:', error);
        
        res.status(401).json({
            success: false,
            message: 'Invalid Firebase token'
        });
    }
});

// Get Google OAuth URL
router.get('/google/url', (req, res) => {
    const authUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/google`;
    
    res.json({
        success: true,
        data: {
            authUrl,
            message: 'Open this URL in a popup window for Google OAuth'
        }
    });
});

export default router;