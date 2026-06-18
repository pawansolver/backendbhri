const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Faculty Model
 * Represents the academic faculty / doctor directory for the website's Faculty Page.
 * This is SEPARATE from the Doctor model (which is used for OPD appointments).
 *
 * UI fields (exact match):
 *  - name, nameHindi, designation, department, credentials, specialty, experience, tags, photo, displayOrder, isActive
 */
const Faculty = sequelize.define('Faculty', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    // ── Core Identity ─────────────────────────────────────
    // e.g. "Dr. S. P. Prasad"
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Name cannot be empty' },
        },
    },
    // Hindi name (for bilingual support) — e.g. "डॉ. एस. पी. प्रसाद"
    nameHindi: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },

    // ── Academic Position ──────────────────────────────────
    // e.g. "Professor & HOD", "Associate Professor", "Assistant Professor"
    designation: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Designation cannot be empty' },
        },
    },
    // e.g. "Department of Biochemistry", "Department of Pharmacology"
    department: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Department cannot be empty' },
        },
    },

    // ── Qualifications ─────────────────────────────────────
    // e.g. "MD, Ph.D. (Medical Biochemistry)"
    credentials: {
        type: DataTypes.STRING(300),
        allowNull: true,
    },
    // e.g. "Molecular Diagnostics & Metabolic Pathways"
    specialty: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // e.g. "20+ Years", "22 Years"
    experience: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },

    // ── Additional Info ────────────────────────────────────
    // JSON array e.g. ["HOD", "Biochemist"]
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },

    // ── Media ──────────────────────────────────────────────
    // URL or relative path to passport-size photo
    // e.g. "/uploads/faculty/faculty-1718700000000.jpg"
    photo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
    },

    // ── Display Control ────────────────────────────────────
    // Lower number = appears first on the website
    displayOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 999,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
    tableName: 'faculty',
});

module.exports = Faculty;
