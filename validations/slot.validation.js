const Joi = require('joi');

const slotValidation = {
    create: Joi.object({
        doctorId: Joi.number().integer().required(),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
        endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    }),
    generate: Joi.object({
        doctorId: Joi.number().integer().required(),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    }),
    generateBulk: Joi.object({
        doctorId: Joi.number().integer().required(),
        startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        days: Joi.number().integer().min(1).max(90).optional(),
    }),
};

module.exports = { slotValidation };
