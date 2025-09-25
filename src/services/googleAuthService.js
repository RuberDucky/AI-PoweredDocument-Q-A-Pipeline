import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/index.js';
import AuthService from './authService.js';
import logger from '../config/logger.js';

class GoogleAuthService {
    constructor() {
        this.client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI,
        );
    }

    async verifyIdToken(idToken) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            return ticket.getPayload();
        } catch (error) {
            logger.error('Failed to verify Google ID token', error);
            throw new Error('Invalid Google ID token');
        }
    }

    async loginOrSignup(idToken) {
        const payload = await this.verifyIdToken(idToken);
        const { sub: googleId, email, name, given_name, family_name, picture } = payload;

        if (!email) {
            throw new Error('Google account has no verified email');
        }

        // Find existing by googleId or email
        let user = await User.findOne({ where: { googleId } });
        if (!user) {
            user = await User.findOne({ where: { email } });
        }

        if (!user) {
            // Create new user (no password)
            user = await User.create({
                fullName: name || [given_name, family_name].filter(Boolean).join(' ') || 'Google User',
                firstName: given_name || null,
                lastName: family_name || null,
                pictureUrl: picture || null,
                email,
                googleId,
                authProvider: 'google',
                password: null,
            });
            logger.info(`Created new Google user: ${email}`);
        } else {
            // Link googleId if not linked
            const updates = {};
            if (!user.googleId) updates.googleId = googleId;
            if (!user.firstName && given_name) updates.firstName = given_name;
            if (!user.lastName && family_name) updates.lastName = family_name;
            if (!user.pictureUrl && picture) updates.pictureUrl = picture;
            if (Object.keys(updates).length) {
                updates.authProvider = 'google';
                await user.update(updates);
            }
        }

        // Generate JWT
        const token = AuthService.generateToken(user.id);
        return { user: user.toJSON(), token };
    }

    // --- Authorization Code Flow Support ---
    getAuthUrl(state = '') {
        const scopes = [
            'openid',
            'email',
            'profile',
        ];
        const url = this.client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes,
            state,
        });
        return url;
    }

    async handleOAuthCallback(code) {
        const { tokens } = await this.client.getToken(code);
        // tokens.id_token contains the ID token we can reuse existing logic with
        if (!tokens.id_token) {
            throw new Error('No id_token returned from Google');
        }
        return this.loginOrSignup(tokens.id_token);
    }
}

export default new GoogleAuthService();
