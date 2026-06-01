const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Doctor = sequelize.define('Doctor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    nameHi: {
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
    qualification: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    photo: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    consultationFee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    maxDailyPatients: {
        type: DataTypes.INTEGER,
        defaultValue: 40,
    },
    opdStartTime: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    opdEndTime: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    slotDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 15,
    },
    availableDays: {
        type: DataTypes.STRING(100),
        defaultValue: 'Mon,Tue,Wed,Thu,Fri,Sat',
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
    tableName: 'doctors',
});

module.exports = Doctor;
