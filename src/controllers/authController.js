import AuthService from '../services/authService.js';
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
}

export default AuthController;
