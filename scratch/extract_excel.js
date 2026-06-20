const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function extract() {
    const filePath = 'C:/Users/pawan/Downloads/BHRIBodhgayaAPI-main/BHRIBodhgayaAPI-main/models/excel/Faculty List..xlsx';
    console.log(`Reading ${filePath}...`);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.worksheets[0]; // Get first sheet
    console.log(`Sheet name: ${worksheet.name}`);
    console.log(`Total rows: ${worksheet.rowCount}`);
    
    // Print the first row (headers)
    const headers = worksheet.getRow(1).values;
    console.log('Headers:', headers);
    
    // Print a sample row
    console.log('Row 2:', worksheet.getRow(2).values);
    
    // Check images
    const images = worksheet.getImages();
    console.log(`Total images found in worksheet: ${images.length}`);
    
    // Check first image to see how it's anchored
    if (images.length > 0) {
        const firstImg = images[0];
        console.log('First image anchor:', JSON.stringify(firstImg.range, null, 2));
    }
}

extract().catch(console.error);
