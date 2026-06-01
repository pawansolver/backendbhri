const User = require('./User');
const Department = require('./Department');
const Doctor = require('./Doctor');
const Slot = require('./Slot');
const Appointment = require('./Appointment');
const AppSetting = require('./AppSetting');
const Contact = require('./Contact');
const Notification = require('./Notification');

// Department <-> Doctor
Department.hasMany(Doctor, { foreignKey: 'departmentId', as: 'doctors' });
Doctor.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Doctor <-> Slot
Doctor.hasMany(Slot, { foreignKey: 'doctorId', as: 'slots' });
Slot.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// Appointment relations
Department.hasMany(Appointment, { foreignKey: 'departmentId', as: 'appointments' });
Appointment.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Slot.hasOne(Appointment, { foreignKey: 'slotId', as: 'appointment' });
Appointment.belongsTo(Slot, { foreignKey: 'slotId', as: 'slot' });

module.exports = {
    User,
    Department,
    Doctor,
    Slot,
    Appointment,
    AppSetting,
    Contact,
    Notification,
};
