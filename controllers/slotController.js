const { Slot, Doctor, Department, Appointment } = require('../models');
const { Op } = require('sequelize');

// Helper: Generate slots from doctor schedule for a specific date
const autoGenerateSlots = async (doctor, date) => {
    if (!doctor.opdStartTime || !doctor.opdEndTime || !doctor.slotDuration) return [];

    const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    if (doctor.availableDays && !doctor.availableDays.includes(dayName)) return [];

    const existing = await Slot.count({ where: { doctorId: doctor.id, date } });
    if (existing > 0) return null; // already exists, skip generation

    const slots = [];
    const [startH, startM] = doctor.opdStartTime.split(':').map(Number);
    const [endH, endM] = doctor.opdEndTime.split(':').map(Number);
    const duration = doctor.slotDuration;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
        const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((currentMinutes + duration) / 60)).padStart(2, '0')}:${String((currentMinutes + duration) % 60).padStart(2, '0')}`;

        slots.push({ doctorId: doctor.id, date, startTime: slotStart, endTime: slotEnd, isBooked: false, isBlocked: false });
        currentMinutes += duration;
    }

    if (slots.length > 0) {
        await Slot.bulkCreate(slots);
        console.log(`Auto-generated ${slots.length} slots for Dr.${doctor.name} on ${date}`);
    }

    return slots;
};

// GET AVAILABLE SLOTS - Public (ADMIN-CONTROLLED - only returns manually set slots)
const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, departmentId, date } = req.query;
        if ((!doctorId && !departmentId) || !date) {
            return res.status(400).json({ success: false, message: 'doctorId or departmentId and date are required' });
        }

        if (departmentId) {
            const department = await Department.findByPk(departmentId);
            if (!department) {
                return res.status(404).json({ success: false, message: 'Department not found' });
            }

            if (!department.isActive) {
                return res.json({ success: true, data: [], message: 'Department is not active' });
            }

            const slots = await Slot.findAll({
                where: { departmentId, date, isBooked: false, isBlocked: false },
                order: [['startTime', 'ASC']],
            });

            return res.json({
                success: true,
                data: slots,
                message: slots.length === 0 ? 'Admin ne is department/date ke liye slots set nahi kiye' : undefined,
                schedule: {
                    departmentName: department.name,
                    consultationFee: department.consultationFee,
                },
            });
        }

        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        if (!doctor.isActive) {
            return res.json({ success: true, data: [], message: 'Doctor is not active' });
        }

        const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
        if (doctor.availableDays && !doctor.availableDays.includes(dayName)) {
            return res.json({ success: true, data: [], message: `Doctor not available on ${dayName}` });
        }

        // ✅ ONLY return slots that admin has manually set - NO auto-generation
        // Admin panel se slots add/generate karo, tabhi yahan dikhenge
        const slots = await Slot.findAll({
            where: { doctorId, date, isBooked: false, isBlocked: false },
            order: [['startTime', 'ASC']],
        });

        res.json({
            success: true,
            data: slots,
            message: slots.length === 0 ? 'Admin ne is date ke liye slots set nahi kiye' : undefined,
            schedule: {
                doctorName: doctor.name,
                opdStart: doctor.opdStartTime,
                opdEnd: doctor.opdEndTime,
                slotDuration: doctor.slotDuration,
                availableDays: doctor.availableDays,
            },
        });
    } catch (error) {
        console.error('createSlot error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GET ALL SLOTS - Admin (all slots with filters, pagination)
// Pass limit=0 to fetch ALL records without pagination
const getAllAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 0, doctorId, departmentId, date, isBooked, isBlocked } = req.query;
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);
        const where = {};

        if (doctorId) where.doctorId = doctorId;
        if (departmentId) where.departmentId = departmentId;
        if (date) where.date = date;
        if (isBooked !== undefined) where.isBooked = isBooked === 'true';
        if (isBlocked !== undefined) where.isBlocked = isBlocked === 'true';

        const queryOptions = {
            where,
            include: [
                { model: Doctor, as: 'doctor', attributes: ['id', 'name'], include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }], required: false },
                { model: Department, as: 'department', attributes: ['id', 'name', 'consultationFee'], required: false },
            ],
            order: [['date', 'DESC'], ['startTime', 'ASC']],
        };

        if (parsedLimit > 0) {
            queryOptions.limit = parsedLimit;
            queryOptions.offset = (parsedPage - 1) * parsedLimit;
        }

        const { count, rows } = await Slot.findAndCountAll(queryOptions);

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

// GET SLOT BY ID
const getById = async (req, res) => {
    try {
        const slot = await Slot.findByPk(req.params.id, {
            include: [
                { model: Doctor, as: 'doctor', include: [{ model: Department, as: 'department' }], required: false },
                { model: Department, as: 'department', required: false },
            ],
        });
        if (!slot) {
            return res.status(404).json({ success: false, message: 'Slot not found' });
        }
        res.json({ success: true, data: slot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// CREATE SINGLE SLOT - Admin
const createSlot = async (req, res) => {
    try {
        const { doctorId, departmentId, date, startTime, endTime } = req.body;

        if ((!doctorId && !departmentId) || !date || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'doctorId or departmentId, date, startTime, endTime are required' });
        }

        if (departmentId) {
            const department = await Department.findByPk(departmentId);
            if (!department) {
                return res.status(404).json({ success: false, message: 'Department not found' });
            }
        } else {
            const doctor = await Doctor.findByPk(doctorId);
            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor not found' });
            }
        }

        const where = departmentId ? { departmentId, date, startTime } : { doctorId, date, startTime };
        const existing = await Slot.findOne({ where });
        if (existing) {
            return res.status(400).json({ success: false, message: `Slot ${startTime} already exists for this date` });
        }

        const slot = await Slot.create({
            doctorId: doctorId || null,
            departmentId: departmentId || null,
            date,
            startTime,
            endTime,
            isBooked: false,
            isBlocked: false,
        });
        res.status(201).json({ success: true, message: `Slot ${startTime} created successfully`, data: slot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// CREATE MULTIPLE CUSTOM SLOTS - Admin (bulk custom times at once)
const createCustomSlotsBulk = async (req, res) => {
    try {
        const { doctorId, departmentId, date, times, duration = 15 } = req.body;
        // times: ['09:00', '10:30', '14:00']

        if ((!doctorId && !departmentId) || !date || !Array.isArray(times) || times.length === 0) {
            return res.status(400).json({ success: false, message: 'doctorId or departmentId, date, and times[] array required' });
        }

        if (departmentId) {
            const department = await Department.findByPk(departmentId);
            if (!department) {
                return res.status(404).json({ success: false, message: 'Department not found' });
            }
        } else {
            const doctor = await Doctor.findByPk(doctorId);
            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor not found' });
            }
        }

        let added = 0;
        let skipped = 0;
        const errors = [];

        for (const startTime of times) {
            try {
                // Calculate endTime
                const [h, m] = startTime.split(':').map(Number);
                const totalMins = h * 60 + m + parseInt(duration);
                const endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;

                const where = departmentId ? { departmentId, date, startTime } : { doctorId, date, startTime };
                const existing = await Slot.findOne({ where });
                if (existing) {
                    skipped++;
                    continue;
                }

                await Slot.create({
                    doctorId: doctorId || null,
                    departmentId: departmentId || null,
                    date,
                    startTime,
                    endTime,
                    isBooked: false,
                    isBlocked: false,
                });
                added++;
            } catch (err) {
                errors.push(`${startTime}: ${err.message}`);
            }
        }

        res.status(201).json({
            success: true,
            message: `${added} slots added, ${skipped} already existed${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
            data: { added, skipped, errors },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GENERATE SLOTS - Manual generate from admin
const generateSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.body;

        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        if (!doctor.opdStartTime || !doctor.opdEndTime) {
            return res.status(400).json({ success: false, message: 'Set doctor OPD timing first' });
        }

        const result = await autoGenerateSlots(doctor, date);
        if (result === null) {
            return res.status(400).json({ success: false, message: 'Slots already exist for this date' });
        }

        res.status(201).json({ success: true, message: `${result.length} slots generated`, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// GENERATE BULK SLOTS - Multiple days at once
const generateBulkSlots = async (req, res) => {
    try {
        const { doctorId, startDate, days = 7 } = req.body;

        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        if (!doctor.opdStartTime || !doctor.opdEndTime) {
            return res.status(400).json({ success: false, message: 'Set doctor OPD timing first' });
        }

        let totalGenerated = 0;
        const start = new Date(startDate + 'T00:00:00');

        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];

            const result = await autoGenerateSlots(doctor, dateStr);
            if (result && result.length > 0) totalGenerated += result.length;
        }

        res.status(201).json({ success: true, message: `${totalGenerated} slots generated for ${days} days` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// REGENERATE SLOTS - Delete old + create new (when timing changes)
const regenerateSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.body;

        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        if (!doctor.opdStartTime || !doctor.opdEndTime) {
            return res.status(400).json({ success: false, message: 'Set doctor OPD timing first' });
        }

        // Delete only unbooked slots for this date
        const bookedCount = await Slot.count({ where: { doctorId, date, isBooked: true } });
        await Slot.destroy({ where: { doctorId, date, isBooked: false } });

        // Generate fresh slots
        const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
        if (doctor.availableDays && !doctor.availableDays.includes(dayName)) {
            return res.json({ success: true, message: `Doctor not available on ${dayName}. Old unbooked slots removed.` });
        }

        const slots = [];
        const [startH, startM] = doctor.opdStartTime.split(':').map(Number);
        const [endH, endM] = doctor.opdEndTime.split(':').map(Number);
        const duration = doctor.slotDuration;

        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        while (currentMinutes + duration <= endMinutes) {
            const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
            const slotEnd = `${String(Math.floor((currentMinutes + duration) / 60)).padStart(2, '0')}:${String((currentMinutes + duration) % 60).padStart(2, '0')}`;
            slots.push({ doctorId, date, startTime: slotStart, endTime: slotEnd });
            currentMinutes += duration;
        }

        if (slots.length > 0) await Slot.bulkCreate(slots);

        res.json({
            success: true,
            message: `Regenerated ${slots.length} new slots${bookedCount > 0 ? ` (${bookedCount} booked slots kept)` : ''}`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE SLOT
const updateSlot = async (req, res) => {
    try {
        const slot = await Slot.findByPk(req.params.id);
        if (!slot) {
            return res.status(404).json({ success: false, message: 'Slot not found' });
        }
        await slot.update(req.body);
        res.json({ success: true, message: 'Slot updated successfully', data: slot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// BLOCK SLOT
const blockSlot = async (req, res) => {
    try {
        const slot = await Slot.findByPk(req.params.id);
        if (!slot) {
            return res.status(404).json({ success: false, message: 'Slot not found' });
        }
        await slot.update({ isBlocked: true });
        res.json({ success: true, message: 'Slot blocked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UNBLOCK SLOT
const unblockSlot = async (req, res) => {
    try {
        const slot = await Slot.findByPk(req.params.id);
        if (!slot) {
            return res.status(404).json({ success: false, message: 'Slot not found' });
        }
        await slot.update({ isBlocked: false });
        res.json({ success: true, message: 'Slot unblocked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// DELETE SLOT
const deleteSlot = async (req, res) => {
    try {
        const slot = await Slot.findByPk(req.params.id);
        if (!slot) {
            return res.status(404).json({ success: false, message: 'Slot not found' });
        }
        if (slot.isBooked) {
            return res.status(400).json({ success: false, message: 'Cannot delete a booked slot. Cancel the appointment first.' });
        }
        await slot.destroy();
        res.json({ success: true, message: 'Slot deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// DELETE ALL SLOTS FOR A DATE
const deleteSlotsByDate = async (req, res) => {
    try {
        const { doctorId, departmentId, date } = req.body;
        if ((!doctorId && !departmentId) || !date) {
            return res.status(400).json({ success: false, message: 'doctorId or departmentId and date are required' });
        }

        const where = departmentId ? { departmentId, date } : { doctorId, date };

        const bookedCount = await Slot.count({ where: { ...where, isBooked: true } });
        if (bookedCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete: ${bookedCount} slots are already booked` });
        }

        const deleted = await Slot.destroy({ where: { ...where, isBooked: false } });
        res.json({ success: true, message: `${deleted} slots deleted for ${date}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAvailableSlots, getAllAdmin, getById,
    createSlot, createCustomSlotsBulk,
    generateSlots, generateBulkSlots, regenerateSlots, updateSlot,
    blockSlot, unblockSlot, deleteSlot, deleteSlotsByDate,
};
