const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Event } = require('../models');

const safeUnlink = (relativePath) => {
    if (!relativePath) return;
    try {
        const absolute = path.join(__dirname, '..', relativePath.replace(/^\//, ''));
        if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
    } catch (err) {
        console.warn('safeUnlink failed:', err.message);
    }
};

const toBool = (val) => {
    if (typeof val === 'boolean') return val;
    if (val === undefined || val === null || val === '') return undefined;
    return val === 'true' || val === '1' || val === 1 || val === true;
};

// CREATE
exports.createEvent = async (req, res) => {
    try {
        const { title, description, eventDate, eventTime, venue } = req.body;

        if (!title || !description || !eventDate) {
            return res.status(400).json({ success: false, message: 'title, description and eventDate are required' });
        }

        let thumbnail = null;
        let pdfAttachment = null;

        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                thumbnail = `/uploads/events/${req.files.thumbnail[0].filename}`;
            }
            if (req.files.pdfAttachment && req.files.pdfAttachment[0]) {
                pdfAttachment = `/uploads/events/${req.files.pdfAttachment[0].filename}`;
            }
        }

        const event = await Event.create({
            title: String(title).trim(),
            description: String(description).trim(),
            eventDate,
            eventTime: eventTime || null,
            venue: venue || null,
            thumbnail,
            pdfAttachment,
            isActive: toBool(req.body.isActive) ?? true,
        });

        return res.status(201).json({ success: true, message: 'Event created successfully', data: event });
    } catch (error) {
        console.error('createEvent error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// READ ALL
exports.getAllEvents = async (req, res) => {
    try {
        const { isActive, upcoming, search, page = 1, limit = 50 } = req.query;
        const where = {};

        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (upcoming === 'true') {
            const today = new Date().toISOString().slice(0, 10);
            where.eventDate = { [Op.gte]: today };
        }
        if (search) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                { [Op.or]: [
                    { title: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } },
                    { venue: { [Op.like]: `%${search}%` } },
                ]},
            ];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Event.findAndCountAll({
            where,
            order: [['eventDate', 'ASC'], ['createdAt', 'DESC']],
            limit: limitNum,
            offset,
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) || 1 },
        });
    } catch (error) {
        console.error('getAllEvents error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// READ ONE
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        return res.status(200).json({ success: true, data: event });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        const { title, description, eventDate, eventTime, venue } = req.body;

        let thumbnail = event.thumbnail;
        let pdfAttachment = event.pdfAttachment;

        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                safeUnlink(event.thumbnail);
                thumbnail = `/uploads/events/${req.files.thumbnail[0].filename}`;
            }
            if (req.files.pdfAttachment && req.files.pdfAttachment[0]) {
                safeUnlink(event.pdfAttachment);
                pdfAttachment = `/uploads/events/${req.files.pdfAttachment[0].filename}`;
            }
        }

        const updates = { thumbnail, pdfAttachment };
        if (title !== undefined) updates.title = String(title).trim();
        if (description !== undefined) updates.description = String(description).trim();
        if (eventDate !== undefined) updates.eventDate = eventDate;
        if (eventTime !== undefined) updates.eventTime = eventTime || null;
        if (venue !== undefined) updates.venue = venue || null;
        const isActive = toBool(req.body.isActive);
        if (isActive !== undefined) updates.isActive = isActive;

        await event.update(updates);
        return res.status(200).json({ success: true, message: 'Event updated successfully', data: event });
    } catch (error) {
        console.error('updateEvent error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// DELETE
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        safeUnlink(event.thumbnail);
        safeUnlink(event.pdfAttachment);
        await event.destroy();
        return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('deleteEvent error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// TOGGLE STATUS
exports.toggleEventStatus = async (req, res) => {
    try {
        const { field } = req.body;
        if (!['isActive'].includes(field)) return res.status(400).json({ success: false, message: 'Invalid field' });

        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        event[field] = !event[field];
        await event.save();
        return res.status(200).json({ success: true, message: `Event ${field} toggled successfully`, data: event });
    } catch (error) {
        console.error('toggleEventStatus error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
