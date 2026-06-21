const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NewsTicker = sequelize.define('NewsTicker', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    textEnglish: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    textHindi: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    link: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    timestamps: true,
});

module.exports = NewsTicker;
