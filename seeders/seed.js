const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const { sequelize } = require('../config/db');
const { Department, Doctor } = require('../models');

const departments = [
    { name: 'Anatomy', nameHi: 'शरीर रचना विज्ञान', icon: '🫀', sortOrder: 1 },
    { name: 'Physiology', nameHi: 'शरीर क्रिया विज्ञान', icon: '🫁', sortOrder: 2 },
    { name: 'Biochemistry', nameHi: 'जैव रसायन', icon: '🧪', sortOrder: 3 },
    { name: 'Pharmacology', nameHi: 'औषध विज्ञान', icon: '💊', sortOrder: 4 },
    { name: 'Pathology', nameHi: 'विकृति विज्ञान', icon: '🔬', sortOrder: 5 },
    { name: 'Microbiology', nameHi: 'सूक्ष्म जीव विज्ञान', icon: '🦠', sortOrder: 6 },
    { name: 'Anaesthesiology', nameHi: 'एनेस्थिसियोलॉजी', icon: '💉', sortOrder: 7 },
    { name: 'Forensic Medicine & Toxicology', nameHi: 'फोरेंसिक मेडिसिन', icon: '🧬', sortOrder: 8 },
    { name: 'Community Medicine', nameHi: 'सामुदायिक चिकित्सा', icon: '🏘️', sortOrder: 9 },
    { name: 'General Medicine', nameHi: 'जनरल मेडिसिन', icon: '🩺', sortOrder: 10 },
    { name: 'Paediatrics', nameHi: 'बाल रोग', icon: '👶', sortOrder: 11 },
    { name: 'Psychiatry', nameHi: 'मनोचिकित्सा', icon: '🧠', sortOrder: 12 },
    { name: 'Dermatology, Venereology & Leprosy', nameHi: 'त्वचा रोग', icon: '🧴', sortOrder: 13 },
    { name: 'Orthopaedics', nameHi: 'हड्डी रोग', icon: '🦴', sortOrder: 14 },
    { name: 'Oto-Rhino-Laryngology (ENT)', nameHi: 'कान-नाक-गला', icon: '👂', sortOrder: 15 },
    { name: 'Ophthalmology', nameHi: 'नेत्र रोग', icon: '👁️', sortOrder: 16 },
    { name: 'Obstetrics & Gynecology', nameHi: 'प्रसूति एवं स्त्री रोग', icon: '🤰', sortOrder: 17 },
    { name: 'Radiology', nameHi: 'रेडियोलॉजी', icon: '📡', sortOrder: 18 },
    { name: 'Dentistry', nameHi: 'दंत चिकित्सा', icon: '🦷', sortOrder: 19 },
    { name: 'General Surgery', nameHi: 'जनरल सर्जरी', icon: '🔪', sortOrder: 20 },
];

const doctors = [
    { name: 'Dr. Sanjay Kumar Singh', departmentName: 'Anatomy', qualification: 'MBBS, MS (Anatomy)', experience: 16, opdStartTime: '09:00', opdEndTime: '13:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 16 },
    { name: 'Dr. Renu Kumari', departmentName: 'Anatomy', qualification: 'MBBS, MD (Anatomy)', experience: 8, opdStartTime: '14:00', opdEndTime: '17:00', slotDuration: 15, consultationFee: 250, maxDailyPatients: 12 },
    { name: 'Dr. Arvind Mishra', departmentName: 'Physiology', qualification: 'MBBS, MD (Physiology)', experience: 12, opdStartTime: '10:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 16 },
    { name: 'Dr. Rakesh Ranjan', departmentName: 'Biochemistry', qualification: 'MBBS, MD (Biochemistry)', experience: 14, opdStartTime: '09:00', opdEndTime: '13:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 16 },
    { name: 'Dr. Manoj Kumar', departmentName: 'Pharmacology', qualification: 'MBBS, MD (Pharmacology)', experience: 18, opdStartTime: '10:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 350, maxDailyPatients: 16 },
    { name: 'Dr. Vinod Kumar Jha', departmentName: 'Pathology', qualification: 'MBBS, MD (Pathology)', experience: 20, opdStartTime: '09:00', opdEndTime: '13:00', slotDuration: 15, consultationFee: 400, maxDailyPatients: 16 },
    { name: 'Dr. Ashok Prasad', departmentName: 'Microbiology', qualification: 'MBBS, MD (Microbiology)', experience: 15, opdStartTime: '09:00', opdEndTime: '12:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 12 },
    { name: 'Dr. Rajendra Prasad', departmentName: 'Anaesthesiology', qualification: 'MBBS, MD (Anaesthesia)', experience: 22, opdStartTime: '08:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 500, maxDailyPatients: 24 },
    { name: 'Dr. Birendra Kumar', departmentName: 'Forensic Medicine & Toxicology', qualification: 'MBBS, MD (Forensic Med)', experience: 17, opdStartTime: '10:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 350, maxDailyPatients: 16 },
    { name: 'Dr. Dinesh Chandra', departmentName: 'Community Medicine', qualification: 'MBBS, MD (Community Med)', experience: 19, opdStartTime: '09:00', opdEndTime: '13:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 16 },
    { name: 'Dr. Rajesh Kumar', departmentName: 'General Medicine', qualification: 'MBBS, MD (Medicine)', experience: 15, opdStartTime: '10:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 16 },
    { name: 'Dr. Priya Singh', departmentName: 'General Medicine', qualification: 'MBBS, MD (Medicine)', experience: 10, opdStartTime: '14:00', opdEndTime: '17:00', slotDuration: 15, consultationFee: 250, maxDailyPatients: 12 },
    { name: 'Dr. Ramesh Yadav', departmentName: 'General Medicine', qualification: 'MBBS, MD (Gen Medicine)', experience: 20, opdStartTime: '09:00', opdEndTime: '12:00', slotDuration: 15, consultationFee: 400, maxDailyPatients: 12 },
    { name: 'Dr. Anil Verma', departmentName: 'Paediatrics', qualification: 'MBBS, MD (Paediatrics)', experience: 11, opdStartTime: '10:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 16 },
    { name: 'Dr. Manish Gupta', departmentName: 'Psychiatry', qualification: 'MBBS, MD (Psychiatry)', experience: 14, opdStartTime: '11:00', opdEndTime: '15:00', slotDuration: 20, consultationFee: 500, maxDailyPatients: 12 },
    { name: 'Dr. Anita Kumari', departmentName: 'Dermatology, Venereology & Leprosy', qualification: 'MBBS, MD (Dermatology)', experience: 7, opdStartTime: '10:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 16 },
    { name: 'Dr. Amit Sharma', departmentName: 'Orthopaedics', qualification: 'MBBS, MS (Ortho)', experience: 12, opdStartTime: '09:00', opdEndTime: '13:00', slotDuration: 15, consultationFee: 400, maxDailyPatients: 16 },
    { name: 'Dr. Vikram Singh', departmentName: 'Orthopaedics', qualification: 'MBBS, MS (Ortho)', experience: 18, opdStartTime: '14:00', opdEndTime: '17:00', slotDuration: 15, consultationFee: 500, maxDailyPatients: 12 },
    { name: 'Dr. Sunita Devi', departmentName: 'Oto-Rhino-Laryngology (ENT)', qualification: 'MBBS, MS (ENT)', experience: 8, opdStartTime: '10:00', opdEndTime: '15:00', slotDuration: 15, consultationFee: 350, maxDailyPatients: 20 },
    { name: 'Dr. Kavita Rani', departmentName: 'Ophthalmology', qualification: 'MBBS, MS (Ophthalmology)', experience: 9, opdStartTime: '10:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 350, maxDailyPatients: 16 },
    { name: 'Dr. Meena Kumari', departmentName: 'Obstetrics & Gynecology', qualification: 'MBBS, MS (OBG)', experience: 20, opdStartTime: '09:00', opdEndTime: '12:00', slotDuration: 15, consultationFee: 500, maxDailyPatients: 12 },
    { name: 'Dr. Rashmi Sinha', departmentName: 'Obstetrics & Gynecology', qualification: 'MBBS, DGO', experience: 12, opdStartTime: '12:00', opdEndTime: '15:00', slotDuration: 15, consultationFee: 400, maxDailyPatients: 12 },
    { name: 'Dr. Vikash Ranjan', departmentName: 'Radiology', qualification: 'MBBS, MD (Radiology)', experience: 10, opdStartTime: '09:00', opdEndTime: '16:00', slotDuration: 15, consultationFee: 350, maxDailyPatients: 28 },
    { name: 'Dr. Rohit Kumar', departmentName: 'Dentistry', qualification: 'BDS, MDS (Orthodontics)', experience: 10, opdStartTime: '10:00', opdEndTime: '14:00', slotDuration: 15, consultationFee: 300, maxDailyPatients: 16 },
    { name: 'Dr. Suresh Prasad', departmentName: 'General Surgery', qualification: 'MBBS, MS (Surgery)', experience: 18, opdStartTime: '09:00', opdEndTime: '13:00', slotDuration: 15, consultationFee: 400, maxDailyPatients: 16 },
    { name: 'Dr. Ravi Shankar', departmentName: 'General Surgery', qualification: 'MBBS, MS (Gen Surgery)', experience: 14, opdStartTime: '14:00', opdEndTime: '17:00', slotDuration: 15, consultationFee: 350, maxDailyPatients: 12 },
];

const seed = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        await sequelize.sync({ alter: true });
        console.log('✅ Tables synced');

        // Seed Departments
        for (const dept of departments) {
            await Department.findOrCreate({
                where: { name: dept.name },
                defaults: dept,
            });
        }
        console.log('✅ 20 Departments seeded');

        // Seed Doctors
        for (const doc of doctors) {
            const dept = await Department.findOne({ where: { name: doc.departmentName } });
            if (dept) {
                const { departmentName, ...docData } = doc;
                await Doctor.findOrCreate({
                    where: { name: doc.name, departmentId: dept.id },
                    defaults: {
                        ...docData,
                        departmentId: dept.id,
                    },
                });
            }
        }
        console.log('✅ Doctors seeded');

        console.log('\n🎉 Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
        process.exit(1);
    }
};

seed();
