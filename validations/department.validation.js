const Joi = require('joi');

const departmentValidation = {
    create: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        nameHi: Joi.string().max(100).optional().allow('', null),
        description: Joi.string().max(1000).optional().allow('', null),
        icon: Joi.string().max(255).optional().allow('', null),
        image: Joi.string().max(500).optional().allow('', null),
        sortOrder: Joi.number().integer().min(0).optional(),
    }),
    update: Joi.object({
        name: Joi.string().min(2).max(100).optional(),
        nameHi: Joi.string().max(100).optional().allow('', null),
        description: Joi.string().max(1000).optional().allow('', null),
        icon: Joi.string().max(255).optional().allow('', null),
        image: Joi.string().max(500).optional().allow('', null),
        isActive: Joi.boolean().optional(),
        sortOrder: Joi.number().integer().min(0).optional(),
    }),
};

module.exports = { departmentValidation };
