import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/index.js';
import firebaseConfig from '../config/firebase.js';
import logger from '../config/logger.js';

class GoogleAuthService {
    constructor() {
        this.initializePassport();
    }

    initializePassport() {
        // Google OAuth Strategy
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL:
                        process.env.GOOGLE_CALLBACK_URL ||
                        '/api/v1/auth/google/callback',
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        await this.handleGoogleAuth(profile, done);
                    } catch (error) {
                        logger.error('Error in Google OAuth strategy:', error);
                        return done(error, null);
                    }
                },
            ),
        );

        // Serialize user for session
        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        // Deserialize user from session
        passport.deserializeUser(async (id, done) => {
            try {
                const user = await User.findByPk(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });
    }

    async handleGoogleAuth(profile, done) {
        try {
            const email = profile.emails[0].value;
            const googleId = profile.id;
            const fullName = profile.displayName;
            const picture = profile.photos[0]?.value;

            // Check if user already exists in our database
            let user = await User.findOne({
                where: { email },
            });

            if (user) {
                // Update user's Google ID and picture if not set
                if (!user.googleId) {
                    await user.update({
                        googleId,
                        profilePicture: picture,
                    });
                }

                logger.info(`Existing user signed in with Google: ${email}`);
                return done(null, user);
            }

            // Create new user
            user = await User.create({
                fullName,
                email,
                googleId,
                profilePicture: picture,
                isActive: true,
                // No password needed for Google OAuth users
                password: null,
                authProvider: 'google',
            });

            logger.info(`New user created via Google OAuth: ${email}`);
            return done(null, user);
        } catch (error) {
            logger.error('Error handling Google authentication:', error);
            return done(error, null);
        }
    }

    async verifyFirebaseToken(idToken) {
        try {
            // Initialize Firebase if not already done
            await firebaseConfig.initialize();

            // Verify the Firebase ID token
            const decodedToken = await firebaseConfig.verifyIdToken(idToken);

            const { email, name, picture, uid, firebase } = decodedToken;

            // Check if user exists in our database
            let user = await User.findOne({
                where: { email },
            });

            if (user) {
                // Update Firebase UID if not set
                if (!user.firebaseUid) {
                    await user.update({
                        firebaseUid: uid,
                        profilePicture: picture || user.profilePicture,
                    });
                }
            } else {
                // Create new user from Firebase token
                user = await User.create({
                    fullName: name || email.split('@')[0],
                    email,
                    firebaseUid: uid,
                    profilePicture: picture,
                    isActive: true,
                    password: null, // No password for Firebase auth
                    authProvider: 'firebase',
                });

                logger.info(`New user created via Firebase auth: ${email}`);
            }

            return {
                user,
                decodedToken,
            };
        } catch (error) {
            logger.error('Error verifying Firebase token:', error);
            throw new Error('Invalid Firebase token');
        }
    }

    getGoogleAuthURL() {
        // Return the URL for Google OAuth
        return '/api/v1/auth/google';
    }
}

export default new GoogleAuthService();
