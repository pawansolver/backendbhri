const Joi = require('joi');

const doctorValidation = {
    create: Joi.object({
        name: Joi.string().min(2).max(150).required(),
        nameHi: Joi.string().max(150).optional().allow('', null),
        departmentId: Joi.number().integer().required(),
        qualification: Joi.string().min(2).max(255).required(),
        experience: Joi.number().integer().min(0).optional(),
        consultationFee: Joi.number().min(0).optional(),
        maxDailyPatients: Joi.number().integer().min(1).optional(),
        opdStartTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
        opdEndTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
        slotDuration: Joi.number().integer().min(5).max(120).optional(),
        availableDays: Joi.string().max(100).optional(),
        phone: Joi.string().max(15).optional().allow('', null),
    }),
    update: Joi.object({
        name: Joi.string().min(2).max(150).optional(),
        nameHi: Joi.string().max(150).optional().allow('', null),
        departmentId: Joi.number().integer().optional(),
        qualification: Joi.string().min(2).max(255).optional(),
        experience: Joi.number().integer().min(0).optional(),
        consultationFee: Joi.number().min(0).optional(),
        maxDailyPatients: Joi.number().integer().min(1).optional(),
        opdStartTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
        opdEndTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
        slotDuration: Joi.number().integer().min(5).max(120).optional(),
        availableDays: Joi.string().max(100).optional(),
        phone: Joi.string().max(15).optional().allow('', null),
        isActive: Joi.boolean().optional(),
    }),
    updateSchedule: Joi.object({
        opdStartTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
        opdEndTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
        slotDuration: Joi.number().integer().min(5).max(120).required(),
        availableDays: Joi.string().max(100).required(),
        maxDailyPatients: Joi.number().integer().min(1).optional(),
    }),
};

module.exports = { doctorValidation };
