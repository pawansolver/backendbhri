const Joi = require('joi');

const slotValidation = {
    create: Joi.object({
        doctorId: Joi.number().integer().optional().allow(null),
        departmentId: Joi.number().integer().optional().allow(null),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
        endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    }).or('doctorId', 'departmentId'),
    generate: Joi.object({
        doctorId: Joi.number().integer().optional().allow(null),
        departmentId: Joi.number().integer().optional().allow(null),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    }).or('doctorId', 'departmentId'),
    generateBulk: Joi.object({
        doctorId: Joi.number().integer().optional().allow(null),
        departmentId: Joi.number().integer().optional().allow(null),
        startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        days: Joi.number().integer().min(1).max(90).optional(),
    }).or('doctorId', 'departmentId'),
};

module.exports = { slotValidation };
