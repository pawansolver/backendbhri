const Joi = require('joi');

const contactValidation = {
    create: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().max(20).optional().allow('', null),
        message: Joi.string().min(5).max(2000).required(),
    }),
    update: Joi.object({
        name: Joi.string().min(2).max(100).optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().max(20).optional().allow('', null),
        message: Joi.string().min(5).max(2000).optional(),
    }),
    updateStatus: Joi.object({
        status: Joi.string().valid('new', 'read', 'resolved').required(),
    }),
};

module.exports = { contactValidation };
