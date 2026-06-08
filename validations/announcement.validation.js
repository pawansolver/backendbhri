const Joi = require('joi');

const announcementValidation = {
    create: Joi.object({
        title: Joi.string().min(2).max(255).required(),
        content: Joi.string().min(2).max(5000).required(),
        isActive: Joi.any().optional(),
        sortOrder: Joi.number().integer().optional(),
    }).unknown(true),
    update: Joi.object({
        title: Joi.string().min(2).max(255).optional(),
        content: Joi.string().min(2).max(5000).optional(),
        isActive: Joi.any().optional(),
        sortOrder: Joi.number().integer().optional(),
    }).unknown(true),
    toggle: Joi.object({
        field: Joi.string().valid('isActive').required(),
    }),
};

module.exports = { announcementValidation };
