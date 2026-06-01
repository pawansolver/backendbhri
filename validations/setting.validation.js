const Joi = require('joi');

const timePattern = /^\d{2}:\d{2}$/;

const settingValidation = {
    opdTiming: Joi.object({
        morningStart: Joi.string().pattern(timePattern).required(),
        morningEnd: Joi.string().pattern(timePattern).required(),
        eveningStart: Joi.string().pattern(timePattern).required(),
        eveningEnd: Joi.string().pattern(timePattern).required(),
    }),
};

module.exports = settingValidation;
