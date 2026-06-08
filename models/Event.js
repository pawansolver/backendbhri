const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    eventTime: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    venue: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pdfAttachment: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
});

module.exports = Event;
