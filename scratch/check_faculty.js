const { sequelize } = require('../config/db');
const Faculty = require('../models/Faculty');

async function checkRecords() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');
        
        const all = await Faculty.findAll();
        console.log(`Total records: ${all.length}`);
        
        const active = await Faculty.findAll({ where: { isActive: true } });
        console.log(`Active records: ${active.length}`);
        
        if (all.length > 0) {
            console.log('Latest record:');
            console.log(all[all.length - 1].toJSON());
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkRecords();
