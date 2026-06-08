const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notice = sequelize.define('Notice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true, // true because we might upload it later or make it optional for now, but user said Required. Let's make it true for safety during transition.
    },
    pdfAttachment: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    publishDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    isNewTag: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    timestamps: true,
});

module.exports = Notice;
