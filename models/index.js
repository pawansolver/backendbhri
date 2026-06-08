const User = require('./User');
const Department = require('./Department');
const Doctor = require('./Doctor');
const Slot = require('./Slot');
const Appointment = require('./Appointment');
const AppSetting = require('./AppSetting');
const Contact = require('./Contact');
const Notification = require('./Notification');
const Notice = require('./Notice');
const Announcement = require('./Announcement');
const Event = require('./Event');

// Department <-> Doctor
Department.hasMany(Doctor, { foreignKey: 'departmentId', as: 'doctors' });
Doctor.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Doctor <-> Slot
Doctor.hasMany(Slot, { foreignKey: 'doctorId', as: 'slots', constraints: false });
Slot.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor', constraints: false });

// Department <-> Slot (current booking flow uses department-level OPD slots)
// constraints:false avoids MySQL FK alter errors on existing shared-hosting tables.
Department.hasMany(Slot, { foreignKey: 'departmentId', as: 'slots', constraints: false });
Slot.belongsTo(Department, { foreignKey: 'departmentId', as: 'department', constraints: false });

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
    Notice,
    Announcement,
    Event,
};
