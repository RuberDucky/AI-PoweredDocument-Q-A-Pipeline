import rateLimit from 'express-rate-limit';

const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            success: false,
            message: message || 'Too many requests, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

const generalLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    'Too many requests from this IP, please try again later.',
);

const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    15, // 15 attempts
    'Too many authentication attempts, please try again later.',
);

const qaLimiter = createRateLimiter(
    60 * 1000, // 1 minute
    10, // 10 questions per minute
    'Too many questions, please slow down.',
);

export { generalLimiter, authLimiter, qaLimiter };
