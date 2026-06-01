const { Appointment, Slot, Doctor, Department, Notification } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

const generateAppointmentId = (date) => {
    const dateStr = date.replace(/-/g, '');
    const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `BHRI-${dateStr}-${random}`;
};

// BOOK APPOINTMENT - Public
const bookAppointment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { patientName, gender, age, mobile, address, symptoms, aadhaar, email, departmentId, doctorId, slotId, date, time } = req.body;

        const slot = await Slot.findByPk(slotId, { transaction });
        if (!slot) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Slot not found' });
        }
        if (slot.isBooked || slot.isBlocked) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Slot is not available' });
        }

        const todayCount = await Appointment.count({
            where: { doctorId, date, status: { [Op.ne]: 'cancelled' } },
            transaction,
        });

        const tokenNumber = todayCount + 1;
        const appointmentId = generateAppointmentId(date);

        const appointment = await Appointment.create({
            appointmentId, tokenNumber, patientName, gender, age, mobile, address, symptoms,
            aadhaar: aadhaar || null, email: email || null,
            departmentId, doctorId, slotId, date, time, status: 'confirmed',
        }, { transaction });

        await slot.update({ isBooked: true }, { transaction });

        await Notification.create({
            type: 'appointment',
            title: 'New Appointment Booked',
            message: `${patientName} booked an appointment for ${date} at ${time}`,
            isRead: false
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: {
                appointmentId: appointment.appointmentId,
                tokenNumber: appointment.tokenNumber,
                patientName: appointment.patientName,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status,
            },
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GET ALL - Admin (with filters, search, pagination)
// Pass limit=0 to fetch ALL records without pagination
const getAll = async (req, res) => {
    try {
        const { page = 1, limit = 0, date, status, doctorId, departmentId, search } = req.query;
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);
        const where = {};

        if (date) where.date = date;
        if (status) where.status = status;
        if (doctorId) where.doctorId = doctorId;
        if (departmentId) where.departmentId = departmentId;
        if (search) {
            where[Op.or] = [
                { patientName: { [Op.like]: `%${search}%` } },
                { mobile: { [Op.like]: `%${search}%` } },
                { appointmentId: { [Op.like]: `%${search}%` } },
                { aadhaar: { [Op.like]: `%${search}%` } },
            ];
        }

        const queryOptions = {
            where,
            include: [
                { model: Department, as: 'department', attributes: ['id', 'name'] },
                { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'qualification'] },
                { model: Slot, as: 'slot', attributes: ['id', 'startTime', 'endTime'] },
            ],
            order: [['date', 'DESC'], ['tokenNumber', 'ASC']],
        };

        if (parsedLimit > 0) {
            queryOptions.limit = parsedLimit;
            queryOptions.offset = (parsedPage - 1) * parsedLimit;
        }

        const { count, rows } = await Appointment.findAndCountAll(queryOptions);

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
        const appointment = await Appointment.findOne({
            where: { [Op.or]: [{ appointmentId: req.params.id }, { id: req.params.id }] },
            include: [
                { model: Department, as: 'department' },
                { model: Doctor, as: 'doctor' },
                { model: Slot, as: 'slot' },
            ],
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// SEARCH BY MOBILE
const searchByMobile = async (req, res) => {
    try {
        const { mobile } = req.query;
        if (!mobile) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' });
        }

        const appointments = await Appointment.findAll({
            where: { mobile },
            include: [
                { model: Department, as: 'department', attributes: ['id', 'name'] },
                { model: Doctor, as: 'doctor', attributes: ['id', 'name'] },
            ],
            order: [['date', 'DESC']],
        });

        res.json({ success: true, data: appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE STATUS - Admin
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (status === 'cancelled' && appointment.slotId) {
            await Slot.update({ isBooked: false }, { where: { id: appointment.slotId } });
        }

        await appointment.update({ status });
        res.json({ success: true, message: 'Status updated successfully', data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE APPOINTMENT - Admin (full edit)
const updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const { patientName, gender, age, mobile, address, symptoms, aadhaar, email } = req.body;
        await appointment.update({ patientName, gender, age, mobile, address, symptoms, aadhaar, email });

        res.json({ success: true, message: 'Appointment updated successfully', data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// DELETE APPOINTMENT - Admin
const deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.slotId) {
            await Slot.update({ isBooked: false }, { where: { id: appointment.slotId } });
        }

        await appointment.destroy();
        res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// TODAY STATS - Admin Dashboard
const getTodayStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [totalToday, pending, confirmed, completed, cancelled] = await Promise.all([
            Appointment.count({ where: { date: today } }),
            Appointment.count({ where: { date: today, status: 'pending' } }),
            Appointment.count({ where: { date: today, status: 'confirmed' } }),
            Appointment.count({ where: { date: today, status: 'completed' } }),
            Appointment.count({ where: { date: today, status: 'cancelled' } }),
        ]);

        const totalDoctors = await Doctor.count({ where: { isActive: true } });
        const totalDepartments = await Department.count({ where: { isActive: true } });

        res.json({
            success: true,
            data: { today, totalToday, pending, confirmed, completed, cancelled, totalDoctors, totalDepartments },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// DATE RANGE REPORT - Admin
const getReport = async (req, res) => {
    try {
        const { startDate, endDate, doctorId, departmentId } = req.query;
        const where = {};

        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.date = { [Op.gte]: startDate };
        }
        if (doctorId) where.doctorId = doctorId;
        if (departmentId) where.departmentId = departmentId;

        const appointments = await Appointment.findAll({
            where,
            include: [
                { model: Department, as: 'department', attributes: ['id', 'name'] },
                { model: Doctor, as: 'doctor', attributes: ['id', 'name'] },
            ],
            order: [['date', 'ASC'], ['tokenNumber', 'ASC']],
        });

        const summary = {
            total: appointments.length,
            confirmed: appointments.filter(a => a.status === 'confirmed').length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length,
            pending: appointments.filter(a => a.status === 'pending').length,
        };

        res.json({ success: true, data: appointments, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    bookAppointment, getAll, getById, searchByMobile,
    updateStatus, updateAppointment, deleteAppointment,
    getTodayStats, getReport,
};
