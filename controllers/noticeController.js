const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Notice } = require('../models');

// Helper: safely delete an uploaded file from disk
const safeUnlink = (relativePath) => {
    if (!relativePath) return;
    try {
        const absolute = path.join(__dirname, '..', relativePath.replace(/^\//, ''));
        if (fs.existsSync(absolute)) {
            fs.unlinkSync(absolute);
        }
    } catch (err) {
        console.warn('safeUnlink failed:', err.message);
    }
};

// Helper: parse boolean from form-data / json
const toBool = (val) => {
    if (typeof val === 'boolean') return val;
    if (val === undefined || val === null || val === '') return undefined;
    return val === 'true' || val === '1' || val === 1 || val === true;
};

// CREATE
exports.createNotice = async (req, res) => {
    try {
        const { title, content, publishDate, expiryDate } = req.body;

        if (!title || !content || !publishDate) {
            return res.status(400).json({
                success: false,
                message: 'title, content and publishDate are required',
            });
        }

        let thumbnail = null;
        let pdfAttachment = null;

        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                thumbnail = `/uploads/notices/${req.files.thumbnail[0].filename}`;
            }
            if (req.files.pdfAttachment && req.files.pdfAttachment[0]) {
                pdfAttachment = `/uploads/notices/${req.files.pdfAttachment[0].filename}`;
            }
        }

        const notice = await Notice.create({
            title: String(title).trim(),
            content: String(content).trim(),
            publishDate,
            expiryDate: expiryDate || null,
            thumbnail,
            pdfAttachment,
            isNewTag: toBool(req.body.isNewTag) ?? true,
            isActive: toBool(req.body.isActive) ?? true,
        });

        return res.status(201).json({
            success: true,
            message: 'Notice created successfully',
            data: notice,
        });
    } catch (error) {
        console.error('createNotice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// READ ALL — public + admin
// Query params:
//   isActive       'true'|'false'  -> filter
//   includeExpired 'true'          -> include past-expiry notices (admin)
//   search         string          -> match in title/content
//   page, limit                    -> pagination
exports.getAllNotices = async (req, res) => {
    try {
        const {
            isActive,
            includeExpired,
            search,
            page = 1,
            limit = 50,
        } = req.query;

        const where = {};

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (includeExpired !== 'true') {
            const today = new Date().toISOString().slice(0, 10);
            where[Op.and] = [
                {
                    [Op.or]: [
                        { expiryDate: null },
                        { expiryDate: { [Op.gte]: today } },
                    ],
                },
            ];
        }

        if (search) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                {
                    [Op.or]: [
                        { title: { [Op.like]: `%${search}%` } },
                        { content: { [Op.like]: `%${search}%` } },
                    ],
                },
            ];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Notice.findAndCountAll({
            where,
            order: [
                ['publishDate', 'DESC'],
                ['createdAt', 'DESC'],
            ],
            limit: limitNum,
            offset,
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(count / limitNum) || 1,
            },
        });
    } catch (error) {
        console.error('getAllNotices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

// READ ONE
exports.getNoticeById = async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }
        return res.status(200).json({ success: true, data: notice });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// UPDATE
exports.updateNotice = async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        const { title, content, publishDate, expiryDate } = req.body;

        let thumbnail = notice.thumbnail;
        let pdfAttachment = notice.pdfAttachment;

        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                safeUnlink(notice.thumbnail);
                thumbnail = `/uploads/notices/${req.files.thumbnail[0].filename}`;
            }
            if (req.files.pdfAttachment && req.files.pdfAttachment[0]) {
                safeUnlink(notice.pdfAttachment);
                pdfAttachment = `/uploads/notices/${req.files.pdfAttachment[0].filename}`;
            }
        }

        const updates = {
            thumbnail,
            pdfAttachment,
            expiryDate: expiryDate === '' ? null : (expiryDate ?? notice.expiryDate),
        };
        if (title !== undefined) updates.title = String(title).trim();
        if (content !== undefined) updates.content = String(content).trim();
        if (publishDate !== undefined) updates.publishDate = publishDate;

        const isNewTag = toBool(req.body.isNewTag);
        if (isNewTag !== undefined) updates.isNewTag = isNewTag;

        const isActive = toBool(req.body.isActive);
        if (isActive !== undefined) updates.isActive = isActive;

        await notice.update(updates);

        return res.status(200).json({
            success: true,
            message: 'Notice updated successfully',
            data: notice,
        });
    } catch (error) {
        console.error('updateNotice error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// DELETE
exports.deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findByPk(req.params.id);
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        safeUnlink(notice.thumbnail);
        safeUnlink(notice.pdfAttachment);

        await notice.destroy();
        return res.status(200).json({ success: true, message: 'Notice deleted successfully' });
    } catch (error) {
        console.error('deleteNotice error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// TOGGLE STATUS
exports.toggleNoticeStatus = async (req, res) => {
    try {
        const { field } = req.body;
        if (!['isActive', 'isNewTag'].includes(field)) {
            return res.status(400).json({ success: false, message: 'Invalid field' });
        }

        const notice = await Notice.findByPk(req.params.id);
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        notice[field] = !notice[field];
        await notice.save();

        return res.status(200).json({
            success: true,
            message: `Notice ${field} toggled successfully`,
            data: notice,
        });
    } catch (error) {
        console.error('toggleNoticeStatus error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
