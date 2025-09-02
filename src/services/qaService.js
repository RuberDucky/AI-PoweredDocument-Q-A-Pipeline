import { QASession } from '../models/index.js';
import pineconeService from './pineconeService.js';
import claudeService from './claudeService.js';
import logger from '../config/logger.js';

class QAService {
    async askQuestion(question, userId) {
        try {
            const startTime = Date.now();

            // Validate question
            const validation = await claudeService.validateQuestion(question);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // Search for relevant documents
            logger.info(`Searching for documents related to: "${question}"`);
            const relevantDocs = await pineconeService.searchSimilar(
                question,
                5,
            );

            logger.info(`Found ${relevantDocs.length} relevant documents`);

            if (relevantDocs.length === 0) {
                // Save session even for no results
                const qaSession = await QASession.create({
                    question,
                    answer: "I don't have any relevant documents to answer your question. Please upload some documents first.",
                    context: [],
                    relevantDocuments: [],
                    tokensUsed: 0,
                    responseTime: Date.now() - startTime,
                    userId,
                });

                return {
                    sessionId: qaSession.id,
                    answer: "I don't have any relevant documents to answer your question. Please upload some documents first.",
                    context: [],
                    relevantDocuments: [],
                    tokensUsed: 0,
                    responseTime: Date.now() - startTime,
                };
            }

            // Generate answer using Claude
            const result = await claudeService.generateAnswer(
                question,
                relevantDocs,
            );

            // Save Q&A session
            const qaSession = await QASession.create({
                question,
                answer: result.answer,
                context: relevantDocs,
                relevantDocuments: relevantDocs.map((doc) => ({
                    id: doc.id,
                    title: doc.metadata.title,
                    score: doc.score,
                })),
                tokensUsed: result.tokensUsed,
                responseTime: result.responseTime,
                userId,
            });

            logger.info(
                `Q&A session created: ${qaSession.id} for user ${userId}`,
            );

            return {
                sessionId: qaSession.id,
                answer: result.answer,
                context: relevantDocs,
                relevantDocuments:
                    result.relevantDocuments ||
                    relevantDocs.map((doc) => ({
                        title: doc.metadata.title,
                        score: doc.score,
                    })),
                tokensUsed: result.tokensUsed,
                responseTime: result.responseTime,
            };
        } catch (error) {
            logger.error('Error in Q&A service:', error);
            throw error;
        }
    }

    async getQAHistory(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await QASession.findAndCountAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                attributes: [
                    'id',
                    'question',
                    'answer',
                    'relevantDocuments',
                    'tokensUsed',
                    'responseTime',
                    'rating',
                    'createdAt',
                ],
            });

            return {
                sessions: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit),
                },
            };
        } catch (error) {
            logger.error('Error getting Q&A history:', error);
            throw error;
        }
    }

    async rateFeedback(sessionId, userId, rating, feedback = '') {
        try {
            const session = await QASession.findOne({
                where: { id: sessionId, userId },
            });

            if (!session) {
                throw new Error('Q&A session not found or access denied');
            }

            await session.update({
                rating,
                feedback: feedback || null,
            });

            logger.info(
                `Feedback added to session ${sessionId}: rating ${rating}`,
            );

            return { message: 'Feedback saved successfully' };
        } catch (error) {
            logger.error('Error saving feedback:', error);
            throw error;
        }
    }

    async getSessionById(sessionId, userId) {
        try {
            const session = await QASession.findOne({
                where: { id: sessionId, userId },
            });

            if (!session) {
                throw new Error('Q&A session not found or access denied');
            }

            return session;
        } catch (error) {
            logger.error('Error getting session by ID:', error);
            throw error;
        }
    }

    async getAnalytics(userId) {
        try {
            const totalSessions = await QASession.count({
                where: { userId },
            });

            const avgResponseTime = await QASession.findOne({
                where: { userId },
                attributes: [
                    [
                        QASession.sequelize.fn(
                            'AVG',
                            QASession.sequelize.col('response_time'),
                        ),
                        'avgResponseTime',
                    ],
                ],
                raw: true,
            });

            const totalTokens = await QASession.findOne({
                where: { userId },
                attributes: [
                    [
                        QASession.sequelize.fn(
                            'SUM',
                            QASession.sequelize.col('tokens_used'),
                        ),
                        'totalTokens',
                    ],
                ],
                raw: true,
            });

            const avgRating = await QASession.findOne({
                where: {
                    userId,
                    rating: { [QASession.sequelize.Op.not]: null },
                },
                attributes: [
                    [
                        QASession.sequelize.fn(
                            'AVG',
                            QASession.sequelize.col('rating'),
                        ),
                        'avgRating',
                    ],
                ],
                raw: true,
            });

            return {
                totalSessions,
                averageResponseTime: Math.round(
                    avgResponseTime?.avgResponseTime || 0,
                ),
                totalTokensUsed: parseInt(totalTokens?.totalTokens || 0),
                averageRating: parseFloat(avgRating?.avgRating || 0).toFixed(1),
            };
        } catch (error) {
            logger.error('Error getting analytics:', error);
            throw error;
        }
    }
}

export default new QAService();
