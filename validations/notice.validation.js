const Joi = require('joi');

// Used after multer parses multipart/form-data — values arrive as strings
const noticeValidation = {
    create: Joi.object({
        title: Joi.string().min(2).max(255).required(),
        content: Joi.string().min(2).max(5000).required(),
        publishDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        expiryDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow('', null),
        isNewTag: Joi.any().optional(),
        isActive: Joi.any().optional(),
    }).unknown(true),
    update: Joi.object({
        title: Joi.string().min(2).max(255).optional(),
        content: Joi.string().min(2).max(5000).optional(),
        publishDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        expiryDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow('', null),
        isNewTag: Joi.any().optional(),
        isActive: Joi.any().optional(),
    }).unknown(true),
    toggle: Joi.object({
        field: Joi.string().valid('isActive', 'isNewTag').required(),
    }),
};

module.exports = { noticeValidation };
