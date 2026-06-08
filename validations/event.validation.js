const Joi = require('joi');

const eventValidation = {
    create: Joi.object({
        title: Joi.string().min(2).max(255).required(),
        description: Joi.string().min(2).max(5000).required(),
        eventDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        eventTime: Joi.string().max(10).optional().allow('', null),
        venue: Joi.string().max(255).optional().allow('', null),
        isActive: Joi.any().optional(),
    }).unknown(true),
    update: Joi.object({
        title: Joi.string().min(2).max(255).optional(),
        description: Joi.string().min(2).max(5000).optional(),
        eventDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        eventTime: Joi.string().max(10).optional().allow('', null),
        venue: Joi.string().max(255).optional().allow('', null),
        isActive: Joi.any().optional(),
    }).unknown(true),
    toggle: Joi.object({
        field: Joi.string().valid('isActive').required(),
    }),
};

module.exports = { eventValidation };
