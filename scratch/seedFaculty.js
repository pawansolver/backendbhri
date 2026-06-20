const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');
const Faculty = require('../models/Faculty');

async function seed() {
    const filePath = path.join(__dirname, '../models/excel/Faculty List..xlsx');
    const uploadDir = path.join(__dirname, '../uploads/faculty');

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    console.log(`Reading Excel file: ${filePath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.worksheets[0];
    
    // Map images to rows
    const images = worksheet.getImages();
    const rowToImageMap = {};

    console.log(`Extracting ${images.length} images...`);
    for (let img of images) {
        // img.range.tl.nativeRow is 0-indexed row number where the top-left corner of the image is anchored
        const rowNum = img.range.tl.nativeRow; 
        
        const imageId = img.imageId;
        const media = workbook.model.media.find(m => m.index === imageId);
        
        if (media && media.buffer) {
            const ext = media.extension || 'png';
            const filename = `faculty_${Date.now()}_${rowNum}.${ext}`;
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, media.buffer);
            
            // In DB we usually store relative path starting with /uploads
            rowToImageMap[rowNum] = `/uploads/faculty/${filename}`;
        }
    }

    console.log('Connecting to Database...');
    await sequelize.authenticate();
    console.log('DB Connected!');

    const records = [];
    
    // Start from row 2 (assuming row 1 is header)
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        
        const vals = row.values;
        // vals = [empty, 'Name', 'Designation', 'Department']
        const name = vals[1] ? vals[1].toString().trim() : '';
        const designation = vals[2] ? vals[2].toString().trim() : '';
        const department = vals[3] ? vals[3].toString().trim() : '';
        
        if (!name) return; // skip empty rows
        
        // exceljs nativeRow is 0-indexed, so rowNumber (1-indexed) corresponds to nativeRow = rowNumber - 1
        const nativeRow = rowNumber - 1;
        const photoPath = rowToImageMap[nativeRow] || null;

        records.push({
            name,
            designation,
            department,
            photo: photoPath,
            isActive: true,
            displayOrder: rowNumber
        });
    });

    console.log(`Found ${records.length} valid faculty records. Inserting into DB...`);
    
    // Using bulkCreate to insert all at once
    await Faculty.bulkCreate(records);
    
    console.log('Data seeding completed successfully!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Error seeding data:', err);
    process.exit(1);
});
