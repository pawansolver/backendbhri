const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AppSetting = sequelize.define('AppSetting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    value: {
        type: DataTypes.JSON,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'app_settings',
});

module.exports = AppSetting;
