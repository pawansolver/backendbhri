const { Department, Doctor } = require('../models');
const { Op } = require('sequelize');

// GET ALL - Public (only active)
const getAll = async (req, res) => {
    try {
        const departments = await Department.findAll({
            where: { isActive: true },
            order: [['sortOrder', 'ASC'], ['name', 'ASC']],
        });
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GET ALL - Admin (active + inactive, with search, pagination)
// Pass limit=0 to fetch ALL records without pagination
const getAllAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 0, search, isActive } = req.query;
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);
        const where = {};

        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { nameHi: { [Op.like]: `%${search}%` } },
            ];
        }

        const queryOptions = {
            where,
            include: [{ model: Doctor, as: 'doctors', attributes: ['id', 'name'], required: false }],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']],
        };

        if (parsedLimit > 0) {
            queryOptions.limit = parsedLimit;
            queryOptions.offset = (parsedPage - 1) * parsedLimit;
        }

        const { count, rows } = await Department.findAndCountAll(queryOptions);

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parsedLimit > 0 ? parsedPage : 1,
                limit: parsedLimit > 0 ? parsedLimit : count,
                totalPages: parsedLimit > 0 ? Math.ceil(count / parsedLimit) : 1,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GET BY ID (with doctors)
const getById = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id, {
            include: [{ model: Doctor, as: 'doctors', where: { isActive: true }, required: false }],
        });
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.json({ success: true, data: department });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// CREATE
const create = async (req, res) => {
    try {
        const { name, nameHi, description, icon, image, sortOrder } = req.body;
        const department = await Department.create({ name, nameHi, description, icon, image, sortOrder });
        res.status(201).json({ success: true, message: 'Department created successfully', data: department });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE
const update = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        await department.update(req.body);
        res.json({ success: true, message: 'Department updated successfully', data: department });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// SOFT DELETE (deactivate)
const remove = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        await department.update({ isActive: false });
        res.json({ success: true, message: 'Department deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// TOGGLE STATUS (activate/deactivate)
const toggleStatus = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        await department.update({ isActive: !department.isActive });
        res.json({
            success: true,
            message: `Department ${department.isActive ? 'activated' : 'deactivated'} successfully`,
            data: department,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// HARD DELETE (permanent)
const hardDelete = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        const doctorCount = await Doctor.count({ where: { departmentId: req.params.id } });
        if (doctorCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete: ${doctorCount} doctors are linked to this department` });
        }

        await department.destroy();
        res.json({ success: true, message: 'Department permanently deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE SORT ORDER
const updateSortOrder = async (req, res) => {
    try {
        const { orders } = req.body; // [{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 1 }]
        for (const item of orders) {
            await Department.update({ sortOrder: item.sortOrder }, { where: { id: item.id } });
        }
        res.json({ success: true, message: 'Sort order updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { getAll, getAllAdmin, getById, create, update, remove, toggleStatus, hardDelete, updateSortOrder };
