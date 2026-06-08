const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Announcement } = require('../models');

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
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, sortOrder } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'title and content are required' });
        }

        let thumbnail = null;
        let pdfAttachment = null;

        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                thumbnail = `/uploads/announcements/${req.files.thumbnail[0].filename}`;
            }
            if (req.files.pdfAttachment && req.files.pdfAttachment[0]) {
                pdfAttachment = `/uploads/announcements/${req.files.pdfAttachment[0].filename}`;
            }
        }

        const announcement = await Announcement.create({
            title: String(title).trim(),
            content: String(content).trim(),
            thumbnail,
            pdfAttachment,
            sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) || 0 : 0,
            isActive: toBool(req.body.isActive) ?? true,
        });

        return res.status(201).json({ success: true, message: 'Announcement created successfully', data: announcement });
    } catch (error) {
        console.error('createAnnouncement error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// READ ALL
exports.getAllAnnouncements = async (req, res) => {
    try {
        const { isActive, search, page = 1, limit = 50 } = req.query;
        const where = {};

        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } },
            ];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Announcement.findAndCountAll({
            where,
            order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
            limit: limitNum,
            offset,
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) || 1 },
        });
    } catch (error) {
        console.error('getAllAnnouncements error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// READ ONE
exports.getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
        return res.status(200).json({ success: true, data: announcement });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE
exports.updateAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

        const { title, content, sortOrder } = req.body;

        let thumbnail = announcement.thumbnail;
        let pdfAttachment = announcement.pdfAttachment;

        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                safeUnlink(announcement.thumbnail);
                thumbnail = `/uploads/announcements/${req.files.thumbnail[0].filename}`;
            }
            if (req.files.pdfAttachment && req.files.pdfAttachment[0]) {
                safeUnlink(announcement.pdfAttachment);
                pdfAttachment = `/uploads/announcements/${req.files.pdfAttachment[0].filename}`;
            }
        }

        const updates = { thumbnail, pdfAttachment };
        if (title !== undefined) updates.title = String(title).trim();
        if (content !== undefined) updates.content = String(content).trim();
        if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder, 10) || 0;
        const isActive = toBool(req.body.isActive);
        if (isActive !== undefined) updates.isActive = isActive;

        await announcement.update(updates);
        return res.status(200).json({ success: true, message: 'Announcement updated successfully', data: announcement });
    } catch (error) {
        console.error('updateAnnouncement error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// DELETE
exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

        safeUnlink(announcement.thumbnail);
        safeUnlink(announcement.pdfAttachment);
        await announcement.destroy();
        return res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('deleteAnnouncement error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// TOGGLE STATUS
exports.toggleAnnouncementStatus = async (req, res) => {
    try {
        const { field } = req.body;
        if (!['isActive'].includes(field)) return res.status(400).json({ success: false, message: 'Invalid field' });

        const announcement = await Announcement.findByPk(req.params.id);
        if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

        announcement[field] = !announcement[field];
        await announcement.save();
        return res.status(200).json({ success: true, message: `Announcement ${field} toggled successfully`, data: announcement });
    } catch (error) {
        console.error('toggleAnnouncementStatus error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
