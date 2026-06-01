const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    appointmentId: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
    },
    tokenNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    patientName: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false,
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    mobile: {
        type: DataTypes.STRING(15),
        allowNull: false,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    symptoms: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    aadhaar: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id',
        },
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'doctors',
            key: 'id',
        },
    },
    slotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'slots',
            key: 'id',
        },
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    time: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
        defaultValue: 'pending',
    },
}, {
    timestamps: true,
    tableName: 'appointments',
});

module.exports = Appointment;
