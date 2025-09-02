import qaService from '../services/qaService.js';
import logger from '../config/logger.js';

class QAController {
    static async askQuestion(req, res, next) {
        try {
            const { question } = req.body;
            const result = await qaService.askQuestion(question, req.user.id);

            res.status(200).json({
                success: true,
                message: 'Question answered successfully',
                data: result,
            });
        } catch (error) {
            logger.error('Ask question controller error:', error);

            if (
                error.message.includes('Question is too short') ||
                error.message.includes('Question is too long')
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }

    static async getQAHistory(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await qaService.getQAHistory(
                req.user.id,
                page,
                limit,
            );

            res.status(200).json({
                success: true,
                message: 'Q&A history retrieved successfully',
                data: result,
            });
        } catch (error) {
            logger.error('Get Q&A history controller error:', error);
            next(error);
        }
    }

    static async getSessionById(req, res, next) {
        try {
            const { id } = req.params;
            const session = await qaService.getSessionById(id, req.user.id);

            res.status(200).json({
                success: true,
                message: 'Q&A session retrieved successfully',
                data: { session },
            });
        } catch (error) {
            logger.error('Get session by ID controller error:', error);

            if (error.message === 'Q&A session not found or access denied') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }

    static async submitFeedback(req, res, next) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;

            const result = await qaService.rateFeedback(
                id,
                req.user.id,
                rating,
                feedback,
            );

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            logger.error('Submit feedback controller error:', error);

            if (error.message === 'Q&A session not found or access denied') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error);
        }
    }

    static async getAnalytics(req, res, next) {
        try {
            const analytics = await qaService.getAnalytics(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Analytics retrieved successfully',
                data: { analytics },
            });
        } catch (error) {
            logger.error('Get analytics controller error:', error);
            next(error);
        }
    }
}

export default QAController;
