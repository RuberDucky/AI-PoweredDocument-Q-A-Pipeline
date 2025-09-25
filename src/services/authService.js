import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import logger from '../config/logger.js';

class AuthService {
    static generateToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            issuer: 'qa-pipeline',
        });
    }

    static async signup(userData) {
        try {
            const { fullName, email, password } = userData;
            let firstName = null;
            let lastName = null;
            if (fullName) {
                const parts = fullName.trim().split(/\s+/);
                if (parts.length === 1) {
                    firstName = parts[0];
                } else if (parts.length > 1) {
                    firstName = parts[0];
                    lastName = parts.slice(1).join(' ');
                }
            }

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Create new user
            const user = await User.create({
                fullName,
                firstName,
                lastName,
                email,
                password,
            });

            // Generate token
            const token = this.generateToken(user.id);

            logger.info(`New user registered: ${email}`);

            return {
                user: user.toJSON(),
                token,
            };
        } catch (error) {
            logger.error('Signup error:', error);
            throw error;
        }
    }

    static async login(loginData) {
        try {
            const { email, password } = loginData;

            // Find user by email
            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Generate token
            const token = this.generateToken(user.id);

            logger.info(`User logged in: ${email}`);

            return {
                user: user.toJSON(),
                token,
            };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    static async getProfile(userId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            return user.toJSON();
        } catch (error) {
            logger.error('Get profile error:', error);
            throw error;
        }
    }
}

export default AuthService;
