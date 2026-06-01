const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = source === 'query' ? req.query : req.body;
        const { error } = schema.validate(dataToValidate, { abortEarly: false });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return res.status(400).json({
                success: false,
                message: 'Invalid request payload',
                errors,
            });
        }

        next();
    };
};

module.exports = validate;
