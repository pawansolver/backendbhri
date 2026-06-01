const { Appointment, Doctor, Department } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ─────────────────────────────────────────────
// Helper: fetch appointments with filters
// ─────────────────────────────────────────────
const fetchAppointments = async ({ startDate, endDate, doctorId, departmentId, status }) => {
    const where = {};

    if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
        where.date = { [Op.gte]: startDate };
    } else if (endDate) {
        where.date = { [Op.lte]: endDate };
    }

    if (doctorId) where.doctorId = doctorId;
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;

    return Appointment.findAll({
        where,
        include: [
            { model: Department, as: 'department', attributes: ['id', 'name'] },
            { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'qualification'] },
        ],
        order: [['date', 'ASC'], ['tokenNumber', 'ASC']],
    });
};

// ─────────────────────────────────────────────
// EXPORT EXCEL
// ─────────────────────────────────────────────
const exportExcel = async (req, res) => {
    try {
        const { startDate, endDate, doctorId, departmentId, status } = req.query;
        const appointments = await fetchAppointments({ startDate, endDate, doctorId, departmentId, status });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'BHRI Bodhgaya Admin';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Appointments Report', {
            pageSetup: { paperSize: 9, orientation: 'landscape' },
        });

        // ── Header branding row ──
        sheet.mergeCells('A1:K1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'BHRI Bodhgaya Hospital – Appointments Report';
        titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A6B' } };
        sheet.getRow(1).height = 36;

        // ── Sub-header: date range ──
        sheet.mergeCells('A2:K2');
        const subCell = sheet.getCell('A2');
        const rangeText = startDate && endDate
            ? `Period: ${startDate} to ${endDate}`
            : startDate ? `From: ${startDate}` : endDate ? `Up to: ${endDate}` : 'All Records';
        subCell.value = `Generated on: ${new Date().toLocaleString('en-IN')}   |   ${rangeText}   |   Total Records: ${appointments.length}`;
        subCell.font = { name: 'Calibri', size: 11, color: { argb: 'FF2A5298' } };
        subCell.alignment = { horizontal: 'center', vertical: 'middle' };
        subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
        sheet.getRow(2).height = 22;

        // ── Summary row ──
        const summary = {
            total: appointments.length,
            confirmed: appointments.filter(a => a.status === 'confirmed').length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length,
            pending: appointments.filter(a => a.status === 'pending').length,
        };
        sheet.mergeCells('A3:K3');
        const summaryCell = sheet.getCell('A3');
        summaryCell.value = `✔ Confirmed: ${summary.confirmed}   |   ✅ Completed: ${summary.completed}   |   ⏳ Pending: ${summary.pending}   |   ✖ Cancelled: ${summary.cancelled}`;
        summaryCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF374151' } };
        summaryCell.alignment = { horizontal: 'center', vertical: 'middle' };
        summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        sheet.getRow(3).height = 20;

        // blank separator
        sheet.getRow(4).height = 6;

        // ── Column headers ──
        const headers = [
            { header: '#', key: 'sr', width: 5 },
            { header: 'Appt ID', key: 'appointmentId', width: 18 },
            { header: 'Token', key: 'tokenNumber', width: 7 },
            { header: 'Patient Name', key: 'patientName', width: 22 },
            { header: 'Gender', key: 'gender', width: 9 },
            { header: 'Age', key: 'age', width: 6 },
            { header: 'Mobile', key: 'mobile', width: 14 },
            { header: 'Department', key: 'department', width: 18 },
            { header: 'Doctor', key: 'doctor', width: 22 },
            { header: 'Date', key: 'date', width: 13 },
            { header: 'Time', key: 'time', width: 10 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Symptoms', key: 'symptoms', width: 30 },
        ];

        sheet.columns = headers;

        // Style header row (row 5 after the 4 header rows)
        const headerRow = sheet.getRow(5);
        headerRow.values = headers.map(h => h.header);
        headerRow.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A5298' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
        headerRow.height = 24;

        // ── Data rows ──
        const statusColors = {
            confirmed: { bg: 'FFD1FAE5', fg: 'FF065F46' },
            completed: { bg: 'FFDBEAFE', fg: 'FF1E40AF' },
            cancelled: { bg: 'FFFEE2E2', fg: 'FF991B1B' },
            pending:   { bg: 'FFFEF3C7', fg: 'FF92400E' },
        };

        appointments.forEach((appt, idx) => {
            const row = sheet.addRow({
                sr: idx + 1,
                appointmentId: appt.appointmentId,
                tokenNumber: appt.tokenNumber,
                patientName: appt.patientName,
                gender: appt.gender || '-',
                age: appt.age || '-',
                mobile: appt.mobile,
                department: appt.department?.name || '-',
                doctor: appt.doctor?.name || '-',
                date: appt.date,
                time: appt.time || '-',
                status: appt.status?.toUpperCase(),
                symptoms: appt.symptoms || '-',
            });

            // Zebra striping
            if (idx % 2 === 0) {
                row.eachCell(cell => {
                    if (!cell.fill?.fgColor) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFF' } };
                    }
                });
            }

            // Status colour
            const statusCell = row.getCell('status');
            const colors = statusColors[appt.status] || { bg: 'FFF3F4F6', fg: 'FF374151' };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } };
            statusCell.font = { bold: true, color: { argb: colors.fg }, size: 10 };
            statusCell.alignment = { horizontal: 'center' };

            row.alignment = { vertical: 'middle' };
            row.height = 20;
        });

        // Borders on all data
        const lastRow = 5 + appointments.length;
        for (let r = 5; r <= lastRow; r++) {
            sheet.getRow(r).eachCell({ includeEmpty: true }, cell => {
                cell.border = {
                    top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
                };
            });
        }

        // Auto-filter
        sheet.autoFilter = {
            from: { row: 5, column: 1 },
            to: { row: lastRow, column: headers.length },
        };

        // Freeze top rows
        sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

        const filename = `BHRI_Report_${startDate || 'all'}_to_${endDate || 'all'}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
};

// ─────────────────────────────────────────────
// EXPORT PDF
// ─────────────────────────────────────────────
const exportPDF = async (req, res) => {
    try {
        const { startDate, endDate, doctorId, departmentId, status } = req.query;
        const appointments = await fetchAppointments({ startDate, endDate, doctorId, departmentId, status });

        const summary = {
            total: appointments.length,
            confirmed: appointments.filter(a => a.status === 'confirmed').length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length,
            pending:   appointments.filter(a => a.status === 'pending').length,
        };

        const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });

        const filename = `BHRI_Report_${startDate || 'all'}_to_${endDate || 'all'}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        const PAGE_W = doc.page.width - 72;   // usable width
        const LEFT   = 36;

        // ── Header banner ──
        doc.rect(LEFT, 30, PAGE_W, 44).fill('#1a3a6b');
        doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
            .text('BHRI Bodhgaya Hospital', LEFT + 12, 38, { width: PAGE_W - 24 });
        doc.fontSize(10).font('Helvetica')
            .text('Appointments Report', LEFT + 12, 58, { width: PAGE_W - 24 });

        // Generated on / period
        doc.moveDown(0.3);
        const rangeText = startDate && endDate
            ? `${startDate}  →  ${endDate}`
            : startDate ? `From ${startDate}` : endDate ? `Up to ${endDate}` : 'All Records';

        doc.rect(LEFT, 80, PAGE_W, 22).fill('#e8f0fe');
        doc.fillColor('#1a3a6b').fontSize(9).font('Helvetica')
            .text(`Generated: ${new Date().toLocaleString('en-IN')}   |   Period: ${rangeText}   |   Total: ${summary.total} records`,
                LEFT + 8, 86, { width: PAGE_W - 16 });

        // ── Summary boxes ──
        const summaryItems = [
            { label: 'Confirmed', value: summary.confirmed, color: '#10b981' },
            { label: 'Completed', value: summary.completed, color: '#3b82f6' },
            { label: 'Pending',   value: summary.pending,   color: '#f59e0b' },
            { label: 'Cancelled', value: summary.cancelled, color: '#ef4444' },
        ];
        const boxW = (PAGE_W - 30) / 4;
        let bx = LEFT;
        const bY = 110;
        summaryItems.forEach(item => {
            doc.rect(bx, bY, boxW, 36).fill(item.color);
            doc.fillColor('#fff').fontSize(16).font('Helvetica-Bold')
                .text(String(item.value), bx, bY + 4, { width: boxW, align: 'center' });
            doc.fontSize(8).font('Helvetica')
                .text(item.label, bx, bY + 22, { width: boxW, align: 'center' });
            bx += boxW + 10;
        });

        // ── Table ──
        const TABLE_TOP = 158;
        const cols = [
            { label: '#',           width: 28 },
            { label: 'Appt ID',     width: 90 },
            { label: 'Patient',     width: 100 },
            { label: 'Gender/Age',  width: 60 },
            { label: 'Mobile',      width: 75 },
            { label: 'Department',  width: 85 },
            { label: 'Doctor',      width: 100 },
            { label: 'Date',        width: 65 },
            { label: 'Status',      width: 60 },
        ];

        // Header row
        doc.rect(LEFT, TABLE_TOP, PAGE_W, 20).fill('#2a5298');
        let cx = LEFT;
        cols.forEach(col => {
            doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold')
                .text(col.label, cx + 3, TABLE_TOP + 6, { width: col.width - 6, ellipsis: true });
            cx += col.width;
        });

        // Data rows
        const statusBg = { confirmed: '#d1fae5', completed: '#dbeafe', cancelled: '#fee2e2', pending: '#fef3c7' };
        const statusFg = { confirmed: '#065f46', completed: '#1e40af', cancelled: '#991b1b', pending: '#92400e' };

        let y = TABLE_TOP + 20;
        const ROW_H = 18;

        appointments.forEach((appt, idx) => {
            // Page break
            if (y + ROW_H > doc.page.height - 40) {
                doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
                y = 40;
                // Repeat table header
                doc.rect(LEFT, y, PAGE_W, 20).fill('#2a5298');
                cx = LEFT;
                cols.forEach(col => {
                    doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold')
                        .text(col.label, cx + 3, y + 6, { width: col.width - 6, ellipsis: true });
                    cx += col.width;
                });
                y += 20;
            }

            // Row background
            const rowBg = idx % 2 === 0 ? '#f8faff' : '#ffffff';
            doc.rect(LEFT, y, PAGE_W, ROW_H).fill(rowBg);

            // Row data
            const values = [
                idx + 1,
                appt.appointmentId || '-',
                appt.patientName || '-',
                `${appt.gender || '-'} / ${appt.age || '-'}`,
                appt.mobile || '-',
                appt.department?.name || '-',
                appt.doctor?.name || '-',
                appt.date || '-',
                (appt.status || '-').toUpperCase(),
            ];

            cx = LEFT;
            values.forEach((val, vi) => {
                const col = cols[vi];
                if (vi === 8) {
                    // Status pill
                    const bg  = statusBg[appt.status]  || '#f3f4f6';
                    const fg  = statusFg[appt.status]  || '#374151';
                    doc.rect(cx + 2, y + 3, col.width - 4, 12).fill(bg);
                    doc.fillColor(fg).fontSize(7).font('Helvetica-Bold')
                        .text(String(val), cx + 2, y + 5, { width: col.width - 4, align: 'center' });
                } else {
                    doc.fillColor('#374151').fontSize(8).font('Helvetica')
                        .text(String(val), cx + 3, y + 5, { width: col.width - 6, ellipsis: true });
                }
                cx += col.width;
            });

            // Row border
            doc.rect(LEFT, y, PAGE_W, ROW_H).strokeColor('#e5e7eb').lineWidth(0.3).stroke();
            y += ROW_H;
        });

        // ── Footer ──
        const footerY = doc.page.height - 30;
        doc.rect(LEFT, footerY - 4, PAGE_W, 20).fill('#f3f4f6');
        doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
            .text(`BHRI Bodhgaya Hospital  |  Confidential Report  |  Page 1`, LEFT, footerY, { width: PAGE_W, align: 'center' });

        doc.end();
    } catch (error) {
        console.error('PDF export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Export failed', error: error.message });
        }
    }
};

module.exports = { exportExcel, exportPDF };
