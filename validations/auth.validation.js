const Joi = require('joi');

const authValidation = {
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),
    register: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }),
    updateProfile: Joi.object({
        name: Joi.string().min(2).max(100).optional(),
    }),
};

module.exports = authValidation;
