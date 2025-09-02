import Joi from 'joi';

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                })),
            });
        }
        next();
    };
};

const signupSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const questionSchema = Joi.object({
    question: Joi.string().min(5).max(1000).required(),
});

const feedbackSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    feedback: Joi.string().max(1000).allow(''),
});

export {
    validateRequest,
    signupSchema,
    loginSchema,
    questionSchema,
    feedbackSchema,
};
