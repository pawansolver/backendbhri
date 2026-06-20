const Joi = require('joi');

const appointmentValidation = {
    book: Joi.object({
        patientName: Joi.string().min(2).max(150).required(),
        gender: Joi.string().valid('Male', 'Female', 'Other').required(),
        age: Joi.number().integer().min(0).max(150).required(),
        mobile: Joi.string().pattern(/^\d{10,12}$/).required().messages({
            'string.pattern.base': 'Mobile number must be between 10 and 12 digits',
        }),
        address: Joi.string().min(5).max(500).required(),
        symptoms: Joi.string().min(3).max(1000).required(),
        aadhaar: Joi.string().pattern(/^\d{12}$/).optional().allow('', null),
        email: Joi.string().email().optional().allow('', null),
        departmentId: Joi.number().integer().required(),
        doctorId: Joi.number().integer().optional().allow(null),
        slotId: Joi.number().integer().required(),
        date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        time: Joi.string().required(),
    }),
};

module.exports = appointmentValidation;
