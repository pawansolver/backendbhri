const { Faculty } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs   = require('fs');

// ─────────────────────────────────────────────────────────
// Helper — normalize a raw DB row for the public API
// Maps DB column names → UI field names
// ─────────────────────────────────────────────────────────
const normalize = (member) => {
    const m = member.toJSON ? member.toJSON() : { ...member };
    return m; // All columns already match UI (designation, department, experience, photo)
};

// ─────────────────────────────────────────────────────────
// 1. GET ALL  (Public — only active records, for website)
//    GET /api/faculty?department=&designation=&page=&limit=
// ─────────────────────────────────────────────────────────
const getAll = async (req, res) => {
    try {
        const where = { isActive: true };
        const { department, designation } = req.query;

        if (department) {
            where.department = { [Op.like]: `%${department}%` };
        }
        if (designation) {
            where.designation = { [Op.like]: `%${designation}%` };
        }

        const faculty = await Faculty.findAll({
            where,
            order: [
                ['displayOrder', 'ASC'],
                ['department', 'ASC'],
                ['name', 'ASC'],
            ],
        });

        res.json({ success: true, total: faculty.length, data: faculty.map(normalize) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 2. GET ALL ADMIN (Admin — search, filters, pagination)
//    GET /api/faculty/admin/all?page=&limit=&search=&department=&designation=&isActive=
//    Pass limit=0 to get ALL records without pagination
// ─────────────────────────────────────────────────────────
const getAllAdmin = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            department,
            designation,
            isActive,
        } = req.query;

        const parsedLimit = parseInt(limit, 10);
        const parsedPage  = parseInt(page, 10);
        const where = {};

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        if (department) {
            where.department = { [Op.like]: `%${department}%` };
        }
        if (designation) {
            where.designation = { [Op.like]: `%${designation}%` };
        }
        if (search) {
            where[Op.or] = [
                { name:        { [Op.like]: `%${search}%` } },
                { nameHindi:   { [Op.like]: `%${search}%` } },
                { credentials: { [Op.like]: `%${search}%` } },
                { specialty:   { [Op.like]: `%${search}%` } },
                { department:  { [Op.like]: `%${search}%` } },
                { designation: { [Op.like]: `%${search}%` } },
            ];
        }

        const queryOptions = {
            where,
            order: [
                ['displayOrder', 'ASC'],
                ['department', 'ASC'],
                ['name', 'ASC'],
            ],
        };

        // Pagination (skip if limit=0 → return all)
        if (parsedLimit > 0) {
            queryOptions.limit  = parsedLimit;
            queryOptions.offset = (parsedPage - 1) * parsedLimit;
        }

        const { count, rows } = await Faculty.findAndCountAll(queryOptions);

        res.json({
            success: true,
            data: rows.map(normalize),
            pagination: {
                total:      count,
                page:       parsedLimit > 0 ? parsedPage : 1,
                limit:      parsedLimit > 0 ? parsedLimit : count,
                totalPages: parsedLimit > 0 ? Math.ceil(count / parsedLimit) : 1,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 3. GET BY ID  (Public or Admin)
//    GET /api/faculty/:id
// ─────────────────────────────────────────────────────────
const getById = async (req, res) => {
    try {
        const member = await Faculty.findByPk(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }
        res.json({ success: true, data: normalize(member) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 4. CREATE  (Admin only)
//    POST /api/faculty
//    Body (multipart/form-data):
//      name*, designation*, department*, credentials, specialty,
//      experience, tags (JSON array or comma-sep string),
//      nameHindi, displayOrder, isActive
//    File: photo (image/jpeg|png|webp — max 5MB)
// ─────────────────────────────────────────────────────────
const create = async (req, res) => {
    try {
        const {
            name, nameHindi,
            credentials, specialty, tags, displayOrder, isActive,
        } = req.body;

        // Accept full names or common aliases
        const designation = req.body.designation || req.body.role;
        const department  = req.body.department  || req.body.dept;
        const experience  = req.body.experience  || req.body.exp;

        // Required-field validation
        if (!name || !designation || !department) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name, designation, department',
            });
        }

        // Parse tags — accept JSON string or comma-separated plain string
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch {
                parsedTags = String(tags).split(',').map((t) => t.trim()).filter(Boolean);
            }
        }

        const facultyData = {
            name:         name.trim(),
            nameHindi:    nameHindi ? nameHindi.trim() : null,
            designation:  designation.trim(),
            department:   department.trim(),
            credentials:  credentials ? credentials.trim() : null,
            specialty:    specialty   ? specialty.trim()   : null,
            experience:   experience  ? experience.trim()  : null,
            tags:         parsedTags,
            displayOrder: displayOrder ? parseInt(displayOrder, 10) : 999,
            isActive:     isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
            photo:        req.file ? `/uploads/faculty/${req.file.filename}` : null,
        };

        const member = await Faculty.create(facultyData);
        res.status(201).json({ success: true, message: 'Faculty member created', data: normalize(member) });
    } catch (error) {
        console.error('Create faculty error:', error.message);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 5. UPDATE  (Admin only)
//    PUT /api/faculty/:id
//    Same body shape as CREATE (all fields optional)
// ─────────────────────────────────────────────────────────
const update = async (req, res) => {
    try {
        const member = await Faculty.findByPk(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }

        const updateData = { ...req.body };

        // Normalize aliases → canonical column names
        if (updateData.role !== undefined && updateData.designation === undefined) {
            updateData.designation = updateData.role;
        }
        delete updateData.role;

        if (updateData.dept !== undefined && updateData.department === undefined) {
            updateData.department = updateData.dept;
        }
        delete updateData.dept;

        if (updateData.exp !== undefined && updateData.experience === undefined) {
            updateData.experience = updateData.exp;
        }
        delete updateData.exp;

        if (updateData.nameHi !== undefined && updateData.nameHindi === undefined) {
            updateData.nameHindi = updateData.nameHi;
        }
        delete updateData.nameHi;

        // Handle new photo upload
        if (req.file) {
            // Delete old photo file if exists and is a local path
            if (member.photo && member.photo.startsWith('/uploads/')) {
                const oldPath = path.join(__dirname, '..', member.photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.photo = `/uploads/faculty/${req.file.filename}`;
        } else if (req.body.removePhoto === 'true') {
            // Admin explicitly removed the photo — delete file from disk and clear DB
            if (member.photo && member.photo.startsWith('/uploads/')) {
                const oldPath = path.join(__dirname, '..', member.photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.photo = null;
        }
        // Remove any stray 'image' / 'removePhoto' keys from body before DB update
        delete updateData.image;
        delete updateData.removePhoto;

        // Parse tags if sent as a string
        if (updateData.tags && typeof updateData.tags === 'string') {
            try {
                updateData.tags = JSON.parse(updateData.tags);
            } catch {
                updateData.tags = updateData.tags.split(',').map((t) => t.trim()).filter(Boolean);
            }
        }

        // Parse numeric displayOrder
        if (updateData.displayOrder !== undefined) {
            updateData.displayOrder = parseInt(updateData.displayOrder, 10);
        }

        // Parse boolean isActive
        if (updateData.isActive !== undefined && typeof updateData.isActive === 'string') {
            updateData.isActive = updateData.isActive === 'true';
        }

        await member.update(updateData);
        res.json({ success: true, message: 'Faculty member updated successfully', data: normalize(member) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 6. BULK IMPORT  (Admin only — JSON array import)
//    POST /api/faculty/bulk
//    Body: { faculty: [ { name, designation, department, ... }, ... ] }
// ─────────────────────────────────────────────────────────
const bulkImport = async (req, res) => {
    try {
        const { faculty } = req.body;

        if (!Array.isArray(faculty) || faculty.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Provide a non-empty array in the "faculty" key',
            });
        }

        const records = faculty.map((f, idx) => {
            // Parse tags
            let tags = [];
            if (f.tags) {
                try {
                    tags = typeof f.tags === 'string' ? JSON.parse(f.tags) : f.tags;
                } catch {
                    tags = String(f.tags).split(',').map((t) => t.trim()).filter(Boolean);
                }
            }

            // Accept full names or aliases
            const designation = f.designation || f.role;
            const department  = f.department  || f.dept;
            const experience  = f.experience  || f.exp;
            const nameHindi   = f.nameHindi   || f.nameHi || null;
            const photo       = f.photo       || f.image  || null;

            if (!f.name || !designation || !department) {
                throw new Error(
                    `Row ${idx + 1} is missing required fields: name, designation, department`
                );
            }

            return {
                name:         f.name.trim(),
                nameHindi:    nameHindi ? nameHindi.trim() : null,
                designation:  designation.trim(),
                department:   department.trim(),
                credentials:  f.credentials ? f.credentials.trim() : null,
                specialty:    f.specialty   ? f.specialty.trim()   : null,
                experience:   experience    ? experience.trim()    : null,
                tags,
                photo,
                displayOrder: f.displayOrder ? parseInt(f.displayOrder, 10) : 999,
                isActive:     f.isActive !== undefined ? Boolean(f.isActive) : true,
            };
        });

        const created = await Faculty.bulkCreate(records, {
            validate: true,
            returning: true,
        });

        res.status(201).json({
            success: true,
            message: `${created.length} faculty records imported successfully`,
            data: created.map(normalize),
        });
    } catch (error) {
        console.error('Bulk import error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 7. TOGGLE ACTIVE STATUS  (Admin only)
//    PATCH /api/faculty/:id/toggle-status
// ─────────────────────────────────────────────────────────
const toggleStatus = async (req, res) => {
    try {
        const member = await Faculty.findByPk(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }
        const newStatus = !member.isActive;
        await member.update({ isActive: newStatus });
        res.json({
            success: true,
            message: `Faculty member ${newStatus ? 'activated' : 'deactivated'} successfully`,
            data: { id: member.id, isActive: newStatus },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 8. SOFT DELETE — deactivate, hide from website
//    DELETE /api/faculty/:id
// ─────────────────────────────────────────────────────────
const remove = async (req, res) => {
    try {
        const member = await Faculty.findByPk(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }
        await member.update({ isActive: false });
        res.json({ success: true, message: 'Faculty member deactivated (hidden from website)' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 9. HARD DELETE — permanent removal  (Admin only)
//    DELETE /api/faculty/:id/permanent
// ─────────────────────────────────────────────────────────
const hardDelete = async (req, res) => {
    try {
        const member = await Faculty.findByPk(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Faculty member not found' });
        }
        // Remove photo from disk if local
        if (member.photo && member.photo.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', member.photo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await member.destroy();
        res.json({ success: true, message: 'Faculty member permanently deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAll,
    getAllAdmin,
    getById,
    create,
    update,
    bulkImport,
    toggleStatus,
    remove,
    hardDelete,
};
