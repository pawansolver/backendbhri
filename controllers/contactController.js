const { Contact, Notification } = require('../models');
const { Op } = require('sequelize');

// Create a new contact message
exports.createContact = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required.'
            });
        }

        const newContact = await Contact.create({
            name,
            email,
            phone,
            message
        });

        await Notification.create({
            type: 'contact',
            title: 'New Contact Message',
            message: `New message from ${name}`,
            isRead: false
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully!',
            data: newContact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
};

// Get all contacts (for admin with pagination, search, filter)
// Pass limit=0 to fetch ALL records without pagination
exports.getAllContacts = async (req, res) => {
    try {
        const { page = 1, limit = 0, search, status } = req.query;
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);
        const where = {};

        if (status) where.status = status;
        
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { message: { [Op.like]: `%${search}%` } },
            ];
        }

        const queryOptions = {
            where,
            order: [['createdAt', 'DESC']],
        };

        if (parsedLimit > 0) {
            queryOptions.limit = parsedLimit;
            queryOptions.offset = (parsedPage - 1) * parsedLimit;
        }

        const { count, rows } = await Contact.findAndCountAll(queryOptions);
        
        res.status(200).json({
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
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contacts',
            error: error.message
        });
    }
};

// Get single contact by ID
exports.getContactById = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact message',
            error: error.message
        });
    }
};

// Update full contact details
exports.updateContact = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        const contact = await Contact.findByPk(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        await contact.update({
            name: name || contact.name,
            email: email || contact.email,
            phone: phone !== undefined ? phone : contact.phone,
            message: message || contact.message,
        });

        res.status(200).json({
            success: true,
            message: 'Contact updated successfully',
            data: contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update contact',
            error: error.message
        });
    }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByPk(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        contact.status = status;
        await contact.save();

        res.status(200).json({
            success: true,
            message: 'Contact status updated successfully',
            data: contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update contact status',
            error: error.message
        });
    }
};

// Delete a contact message
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        await contact.destroy();

        res.status(200).json({
            success: true,
            message: 'Contact message deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete contact message',
            error: error.message
        });
    }
};
