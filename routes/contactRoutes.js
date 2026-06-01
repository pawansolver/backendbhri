const express = require('express');
const {
    createContact,
    getAllContacts,
    getContactById,
    updateContact,
    updateContactStatus,
    deleteContact
} = require('../controllers/contactController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Contact form management
 */

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Submit a new contact message
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/', createContact);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Get all contact messages
 *     tags: [Contacts]
 *     responses:
 *       200:
 *         description: List of all contacts
 */
router.get('/', getAllContacts);

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: Get contact message by ID
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contact details
 */
router.get('/:id', getContactById);

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: Update full contact message details
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact updated successfully
 */
router.put('/:id', updateContact);

/**
 * @swagger
 * /api/contacts/{id}/status:
 *   patch:
 *     summary: Update contact message status
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, read, resolved]
 *     responses:
 *       200:
 *         description: Contact status updated
 */
router.patch('/:id/status', updateContactStatus);

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: Delete a contact message
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contact message deleted
 */
router.delete('/:id', deleteContact);

module.exports = router;
