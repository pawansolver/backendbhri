const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, sequelize } = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const bcrypt = require('bcryptjs');

// Import Models (registers them with Sequelize)
const { User, Department, Doctor, Slot, Appointment, AppSetting, Contact, Notification } = require('./models');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const slotRoutes = require('./routes/slotRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const settingRoutes = require('./routes/settingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const exportRoutes = require('./routes/exportRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);

// Request logger for debugging
app.use('/api', (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// Basic Route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'BHRI Backend Server is Running!',
        endpoints: {
            auth: '/api/auth',
            departments: '/api/departments',
            doctors: '/api/doctors',
            slots: '/api/slots',
            appointments: '/api/appointments',
            settings: '/api/settings',
            contacts: '/api/contacts',
            notifications: '/api/notifications',
            docs: '/api-docs',
        },
    });
});

const PORT = process.env.PORT || 5000;

// Seed Admin User
const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) return;

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const [user, created] = await User.findOrCreate({
            where: { email: adminEmail },
            defaults: {
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
            },
        });

        if (!created) {
            user.password = hashedPassword;
            await user.save();
            console.log('Admin password synced with .env');
        } else {
            console.log('Admin user created');
        }
    } catch (error) {
        console.error('Admin seeding failed:', error.message);
    }
};

// Start Server
const startServer = async () => {
    try {
        await connectDB();

        await sequelize.sync({ force: false, alter: true });
        console.log('MySQL Models Synced!');

        await seedAdmin();
    } catch (error) {
        console.error('Database connection deferred:', error.message);
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`API Docs: http://localhost:${PORT}/api-docs`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Close the other terminal or use a different port.`);
            process.exit(1);
        }
    });
};

startServer();
