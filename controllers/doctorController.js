const { Doctor, Department, Slot, Appointment } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// GET ALL - Public (only active)
const getAll = async (req, res) => {
    try {
        const where = { isActive: true };
        if (req.query.departmentId) where.departmentId = req.query.departmentId;

        const doctors = await Doctor.findAll({
            where,
            include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'nameHi'] }],
            order: [['name', 'ASC']],
        });
        res.json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GET ALL - Admin (active + inactive, with search, pagination, filters)
// Pass limit=0 to fetch ALL records without pagination
const getAllAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 0, search, departmentId, isActive } = req.query;
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);
        const where = {};

        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (departmentId) where.departmentId = departmentId;
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { nameHi: { [Op.like]: `%${search}%` } },
                { qualification: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
            ];
        }

        // If limit=0 or not provided, fetch ALL records (no pagination)
        const queryOptions = {
            where,
            include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'nameHi'] }],
            order: [['name', 'ASC']],
        };

        if (parsedLimit > 0) {
            queryOptions.limit = parsedLimit;
            queryOptions.offset = (parsedPage - 1) * parsedLimit;
        }

        const { count, rows } = await Doctor.findAndCountAll(queryOptions);

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

// GET BY ID
const getById = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id, {
            include: [{ model: Department, as: 'department' }],
        });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        res.json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GET BY DEPARTMENT
const getByDepartment = async (req, res) => {
    try {
        const doctors = await Doctor.findAll({
            where: { departmentId: req.params.departmentId, isActive: true },
            include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
            order: [['name', 'ASC']],
        });
        res.json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// CREATE
const create = async (req, res) => {
    try {
        // FormData sends everything as strings — parse numeric fields explicitly
        const departmentId = parseInt(req.body.departmentId, 10);

        if (!departmentId || isNaN(departmentId)) {
            return res.status(400).json({ success: false, message: 'Please select a valid department.' });
        }

        const dept = await Department.findByPk(departmentId);
        if (!dept) {
            return res.status(400).json({ success: false, message: 'Selected department not found.' });
        }

        const doctorData = {
            name: req.body.name?.trim(),
            qualification: req.body.qualification?.trim(),
            departmentId,
            experience: req.body.experience ? parseInt(req.body.experience, 10) : 0,
            consultationFee: req.body.consultationFee ? parseFloat(req.body.consultationFee) : 0,
            maxDailyPatients: req.body.maxDailyPatients ? parseInt(req.body.maxDailyPatients, 10) : 16,
            slotDuration: req.body.slotDuration ? parseInt(req.body.slotDuration, 10) : 15,
            opdStartTime: req.body.opdStartTime || '09:00',
            opdEndTime: req.body.opdEndTime || '14:00',
            availableDays: req.body.availableDays || 'Mon,Tue,Wed,Thu,Fri,Sat',
            phone: req.body.phone || null,
            nameHi: req.body.nameHi || null,
            photo: req.file ? `/uploads/doctors/${req.file.filename}` : null,
        };

        const doctor = await Doctor.create(doctorData);
        res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor });
    } catch (error) {
        console.error('Create doctor error:', error.message);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE
const update = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const updateData = { ...req.body };

        if (req.file) {
            // Delete old photo from disk before saving new one
            if (doctor.photo && doctor.photo.startsWith('/uploads/')) {
                const oldPath = path.join(__dirname, '..', doctor.photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.photo = `/uploads/doctors/${req.file.filename}`;
        } else if (req.body.removePhoto === 'true') {
            // Admin explicitly removed the photo
            if (doctor.photo && doctor.photo.startsWith('/uploads/')) {
                const oldPath = path.join(__dirname, '..', doctor.photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.photo = null;
        }
        delete updateData.removePhoto;

        const scheduleFields = ['opdStartTime', 'opdEndTime', 'slotDuration', 'availableDays', 'maxDailyPatients'];
        const scheduleChanged = scheduleFields.some((field) => (
            Object.prototype.hasOwnProperty.call(updateData, field) && String(updateData[field]) !== String(doctor[field])
        ));

        await doctor.update(updateData);

        let clearedSlots = 0;
        if (scheduleChanged) {
            const today = new Date().toISOString().split('T')[0];
            clearedSlots = await Slot.destroy({
                where: {
                    doctorId: doctor.id,
                    date: { [Op.gte]: today },
                    isBooked: false,
                },
            });
        }

        res.json({
            success: true,
            message: scheduleChanged
                ? `Doctor updated. ${clearedSlots} future unbooked slots cleared for fresh regeneration.`
                : 'Doctor updated successfully',
            data: doctor,
            scheduleSync: {
                scheduleChanged,
                clearedSlots,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// SOFT DELETE (deactivate)
const remove = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        await doctor.update({ isActive: false });
        res.json({ success: true, message: 'Doctor deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// TOGGLE STATUS
const toggleStatus = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        await doctor.update({ isActive: !doctor.isActive });
        res.json({
            success: true,
            message: `Doctor ${doctor.isActive ? 'activated' : 'deactivated'} successfully`,
            data: doctor,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// HARD DELETE
const hardDelete = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const appointmentCount = await Appointment.count({ where: { doctorId: req.params.id } });
        if (appointmentCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete: ${appointmentCount} appointments are linked` });
        }

        await Slot.destroy({ where: { doctorId: req.params.id } });
        // Delete photo from disk if local
        if (doctor.photo && doctor.photo.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', doctor.photo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await doctor.destroy();
        res.json({ success: true, message: 'Doctor permanently deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE SCHEDULE (OPD timing, slot duration, available days)
// Also deletes future unbooked slots so new timing takes effect automatically
const updateSchedule = async (req, res) => {
    try {
        console.log('Schedule update request:', req.params.id, req.body);
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const { opdStartTime, opdEndTime, slotDuration, availableDays, maxDailyPatients } = req.body;

        if (!opdStartTime || !opdEndTime) {
            return res.status(400).json({ success: false, message: 'OPD start and end time are required' });
        }

        await doctor.update({
            opdStartTime: opdStartTime || doctor.opdStartTime,
            opdEndTime: opdEndTime || doctor.opdEndTime,
            slotDuration: slotDuration || doctor.slotDuration,
            availableDays: availableDays || doctor.availableDays,
            maxDailyPatients: maxDailyPatients || doctor.maxDailyPatients,
        });

        // Delete all FUTURE unbooked slots so they regenerate with new timing
        const today = new Date().toISOString().split('T')[0];
        const deleted = await Slot.destroy({
            where: {
                doctorId: doctor.id,
                date: { [Op.gte]: today },
                isBooked: false,
            },
        });

        const updated = await Doctor.findByPk(req.params.id);
        console.log('Schedule updated:', updated.opdStartTime, updated.opdEndTime, updated.slotDuration, `| ${deleted} future slots cleared`);

        res.json({
            success: true,
            message: `Schedule updated! ${deleted} future slots cleared - new slots will auto-generate with new timing.`,
            data: updated,
        });
    } catch (error) {
        console.error('Schedule update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GET DOCTOR SCHEDULE - Public (for main website)
const getSchedule = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id, {
            attributes: ['id', 'name', 'opdStartTime', 'opdEndTime', 'slotDuration', 'availableDays', 'maxDailyPatients', 'consultationFee'],
            include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
        });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        res.json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { getAll, getAllAdmin, getById, getByDepartment, create, update, remove, toggleStatus, hardDelete, updateSchedule, getSchedule };
