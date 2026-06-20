const Joi = require('joi');

const facultyValidation = {
    create: Joi.object({
        name: Joi.string().min(2).max(150).required(),
        nameHindi: Joi.string().max(150).optional().allow('', null),
        designation: Joi.string().max(150).optional().allow('', null),
        role: Joi.string().max(150).optional().allow('', null),
        department: Joi.string().max(150).optional().allow('', null),
        dept: Joi.string().max(150).optional().allow('', null),
        credentials: Joi.string().max(255).optional().allow('', null),
        specialty: Joi.string().max(255).optional().allow('', null),
        experience: Joi.string().max(255).optional().allow('', null),
        exp: Joi.string().max(255).optional().allow('', null),
        tags: Joi.any().optional(),
        displayOrder: Joi.any().optional(),
        isActive: Joi.any().optional(),
    }).or('designation', 'role').or('department', 'dept').unknown(true),

    update: Joi.object({
        name: Joi.string().min(2).max(150).optional(),
        nameHindi: Joi.string().max(150).optional().allow('', null),
        nameHi: Joi.string().max(150).optional().allow('', null),
        designation: Joi.string().max(150).optional().allow('', null),
        role: Joi.string().max(150).optional().allow('', null),
        department: Joi.string().max(150).optional().allow('', null),
        dept: Joi.string().max(150).optional().allow('', null),
        credentials: Joi.string().max(255).optional().allow('', null),
        specialty: Joi.string().max(255).optional().allow('', null),
        experience: Joi.string().max(255).optional().allow('', null),
        exp: Joi.string().max(255).optional().allow('', null),
        tags: Joi.any().optional(),
        displayOrder: Joi.any().optional(),
        isActive: Joi.any().optional(),
        removePhoto: Joi.any().optional(),
    }).unknown(true),

    bulkImport: Joi.object({
        faculty: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                designation: Joi.string().optional().allow('', null),
                role: Joi.string().optional().allow('', null),
                department: Joi.string().optional().allow('', null),
                dept: Joi.string().optional().allow('', null),
            }).or('designation', 'role').or('department', 'dept').unknown(true)
        ).min(1).required(),
    }),
};

module.exports = { facultyValidation };
