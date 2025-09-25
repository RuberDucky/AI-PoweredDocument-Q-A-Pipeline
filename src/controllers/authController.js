import AuthService from '../services/authService.js';
import GoogleAuthService from '../services/googleAuthService.js';
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

    static async googleLogin(req, res, next) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({
                    success: false,
                    message: 'idToken is required',
                });
            }

            const result = await GoogleAuthService.loginOrSignup(idToken);
            res.status(200).json({
                success: true,
                message: 'Google login successful',
                data: result,
            });
        } catch (error) {
            logger.error('Google login controller error:', error);
            return res.status(401).json({
                success: false,
                message: error.message || 'Google authentication failed',
            });
        }
    }

    // --- OAuth Authorization Code Flow ---
    static async googleOAuthStart(req, res) {
        try {
            const { state } = req.query; // optional state param
            const url = GoogleAuthService.getAuthUrl(state);
            res.status(200).json({ success: true, data: { url } });
        } catch (error) {
            logger.error('Google OAuth start error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate Google OAuth URL',
            });
        }
    }

    static async googleOAuthCallback(req, res) {
        try {
            const { code, state } = req.query;
            if (!code) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: 'Authorization code missing',
                    });
            }
            const result = await GoogleAuthService.handleOAuthCallback(code);

            // Decide response strategy: redirect with token (less secure) or JSON.
            const frontend =
                process.env.FRONTEND_URL || 'http://localhost:5173';
            if (req.accepts('html') && !req.accepts('json')) {
                // Fallback simple HTML auto-post (could be replaced with redirect carrying code in hash)
                return res.send(
                    `<!DOCTYPE html><html><body><script>window.opener && window.opener.postMessage(${JSON.stringify(
                        {
                            type: 'google-auth-success',
                            token: result.token,
                            user: result.user,
                            state,
                        },
                    )}, '*'); window.close();</script>Success</body></html>`,
                );
            }

            // Default JSON response (client handles storage)
            res.status(200).json({
                success: true,
                message: 'Google OAuth successful',
                data: result,
            });
        } catch (error) {
            logger.error('Google OAuth callback error:', error);
            res.status(401).json({
                success: false,
                message: error.message || 'Google OAuth failed',
            });
        }
    }
}

export default AuthController;
