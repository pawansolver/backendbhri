const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Slot = sequelize.define('Slot', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    startTime: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    endTime: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    isBooked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
    tableName: 'slots',
});

module.exports = Slot;
