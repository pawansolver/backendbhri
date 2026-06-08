/**
 * PDF Slip Service — BHRI Bodhgaya Hospital
 * Generates a professional A5-size appointment confirmation slip PDF.
 *
 * Layout:
 *   ┌─────────────────────────────────────┐
 *   │  BHRI BODHGAYA HOSPITAL  [header]   │
 *   │  Appointment Confirmation Slip      │
 *   ├─────────────────────────────────────┤
 *   │  TOKEN  #06              [big pill] │
 *   ├─────────────────────────────────────┤
 *   │  Patient Details  (2-col grid)      │
 *   │  Appointment Details                │
 *   ├─────────────────────────────────────┤
 *   │  [QR Code]   Scan to verify         │
 *   ├─────────────────────────────────────┤
 *   │  Footer — BHRI branding             │
 *   └─────────────────────────────────────┘
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { generateQRBuffer } = require('./qrCodeService');

// Devanagari fonts need a fontkit null-anchor guard (foliojs/fontkit#354)
(() => {
    try {
        const fontkitPath = require.resolve('fontkit/dist/main.cjs');
        const guard = 'if (!anchor) return { x: 0, y: 0 };';
        let src = fs.readFileSync(fontkitPath, 'utf8');
        if (!src.includes(guard)) {
            src = src.replace(
                '    getAnchor(anchor) {\n        // TODO: contour point, device tables\n        let x = anchor.xCoordinate;',
                `    getAnchor(anchor) {\n        // TODO: contour point, device tables\n        ${guard}\n        let x = anchor.xCoordinate;`
            );
            fs.writeFileSync(fontkitPath, src);
            delete require.cache[fontkitPath];
        }
    } catch (_) { /* fontkit layout patch optional */ }
})();

const FONT_HI = path.join(__dirname, '../assets/fonts/NotoSansDevanagari-Regular.ttf');
const FONT_HI_BOLD = path.join(__dirname, '../assets/fonts/NotoSansDevanagari-Bold.ttf');
const hasHindiFont = fs.existsSync(FONT_HI) && fs.existsSync(FONT_HI_BOLD);

const hi = (doc, bold = false) => {
    if (hasHindiFont) {
        doc.font(bold ? 'NotoDevanagari-Bold' : 'NotoDevanagari');
    } else {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
    }
};

const en = (doc, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
};

const DEVANAGARI_RE = /[\u0900-\u097F]/;

// Split a string into consecutive runs of Devanagari vs. non-Devanagari
// so each run can be drawn with the correct font (Noto has no Latin glyphs,
// Helvetica has no Devanagari glyphs).
const segmentText = (text) => {
    const str = String(text ?? '');
    const out = [];
    let buf = '';
    let currentIsHi = false;
    
    for (const ch of str) {
        const isHi = DEVANAGARI_RE.test(ch);
        const isLatin = /[A-Za-z]/.test(ch);
        
        let charIsHi = currentIsHi;
        if (isHi) charIsHi = true;
        else if (isLatin) charIsHi = false;
        
        if (buf.length === 0) {
            currentIsHi = charIsHi;
            buf += ch;
        } else if (charIsHi === currentIsHi) {
            buf += ch;
        } else {
            out.push({ text: buf, hi: currentIsHi });
            buf = ch;
            currentIsHi = charIsHi;
        }
    }
    if (buf) out.push({ text: buf, hi: currentIsHi });
    return out.length ? out : [{ text: '', hi: false }];
};

// Draw a (possibly mixed Hindi+English) string in one line, switching fonts per run.
// Honours x/y and PDFKit text options; uses `continued` to chain segments.
const drawSmart = (doc, text, x, y, opts = {}, bold = false) => {
    const segs = segmentText(text);
    
    if (segs.length === 1) {
        (segs[0].hi ? hi : en)(doc, bold);
        doc.text(segs[0].text, x, y, opts);
        return;
    }

    // For multiple segments, if align is center or right, calculate total width
    // and draw sequentially from a calculated starting X to avoid PDFKit `continued` bugs.
    if (opts.align === 'center' || opts.align === 'right') {
        let totalWidth = 0;
        segs.forEach(seg => {
            (seg.hi ? hi : en)(doc, bold);
            seg.width = doc.widthOfString(seg.text, opts);
            totalWidth += seg.width;
        });

        let currentX = x;
        if (opts.align === 'center') {
            currentX = x + (opts.width - totalWidth) / 2;
        } else if (opts.align === 'right') {
            currentX = x + opts.width - totalWidth;
        }

        segs.forEach(seg => {
            (seg.hi ? hi : en)(doc, bold);
            doc.text(seg.text, currentX, y, { ...opts, align: 'left', width: undefined });
            currentX += seg.width;
        });
    } else {
        // For left-aligned text, we can use continued: true which supports wrapping
        segs.forEach((seg, i) => {
            (seg.hi ? hi : en)(doc, bold);
            const isLast = i === segs.length - 1;
            const segOpts = { ...opts, continued: !isLast };
            if (i === 0) {
                doc.text(seg.text, x, y, segOpts);
            } else {
                doc.text(seg.text, segOpts);
            }
        });
    }
};

const STATUS_HI = {
    confirmed: 'पुष्टि',
    completed: 'पूर्ण',
    pending: 'लंबित',
    cancelled: 'रद्द',
};

const GENDER_HI = {
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    m: 'पुरुष',
    f: 'महिला',
};

const toHiGender = (g) => {
    if (!g) return null;
    return GENDER_HI[String(g).toLowerCase()] || g;
};

const clean = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s || s === '—' || s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
    return s;
};

// ─── Brand palette ──────────────────────────────────────────────────────────
const C = {
    brand: '#1a3a6b',   // deep navy — primary brand
    accent: '#2a7ae4',   // bright blue — accents
    success: '#059669',   // green — confirmed token
    light: '#e8f0fe',   // very light blue — section bg
    divider: '#cbd5e1',   // slate divider
    textDark: '#1e293b',
    textMid: '#475569',
    textLight: '#94a3b8',
    white: '#ffffff',
    slipBg: '#f8faff',
};

// ─── Dimensions (A5 portrait in points: 419.53 × 595.28) ────────────────────
const PAGE_W = 419.53;
const PAGE_H = 595.28;
const MARGIN = 30;
const USABLE = PAGE_W - MARGIN * 2;

/**
 * Draw a filled rounded rectangle (PDFKit doesn't have roundedRect natively — workaround).
 */
const roundRect = (doc, x, y, w, h, r, fillColor, strokeColor) => {
    doc.save()
        .moveTo(x + r, y)
        .lineTo(x + w - r, y)
        .quadraticCurveTo(x + w, y, x + w, y + r)
        .lineTo(x + w, y + h - r)
        .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        .lineTo(x + r, y + h)
        .quadraticCurveTo(x, y + h, x, y + h - r)
        .lineTo(x, y + r)
        .quadraticCurveTo(x, y, x + r, y)
        .closePath();

    if (fillColor) doc.fillColor(fillColor).fill();
    if (strokeColor) doc.strokeColor(strokeColor).lineWidth(1).stroke();
    doc.restore();
};

/**
 * Main: generate a PDF Buffer for an appointment.
 *
 * @param {object} appointment   Full Sequelize appointment instance with .doctor, .department
 * @returns {Promise<Buffer>}    Raw PDF bytes
 */
const generateSlipPDF = async (appointment) => {
    return new Promise(async (resolve, reject) => {
        try {
            // ── Generate QR code ──────────────────────────────────────────────
            const qrBuffer = await generateQRBuffer(appointment.appointmentId);

            // ── Setup PDF ─────────────────────────────────────────────────────
            const doc = new PDFDocument({
                size: [PAGE_W, PAGE_H],
                margin: 0,
                info: {
                    Title: `Appointment Slip — ${appointment.appointmentId}`,
                    Author: 'BHRI Bodhgaya Hospital',
                    Subject: 'Appointment Confirmation',
                    Keywords: 'BHRI, appointment, confirmation',
                },
            });

            if (hasHindiFont) {
                doc.registerFont('NotoDevanagari', FONT_HI);
                doc.registerFont('NotoDevanagari-Bold', FONT_HI_BOLD);
            }

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(err));

            // ── BACKGROUND ────────────────────────────────────────────────────
            doc.rect(0, 0, PAGE_W, PAGE_H).fill(C.slipBg);

            // subtle decorative side bar
            doc.rect(0, 0, 6, PAGE_H).fill(C.brand);
            doc.rect(PAGE_W - 6, 0, 6, PAGE_H).fill(C.brand);

            // ── HEADER BANNER ─────────────────────────────────────────────────
            doc.rect(0, 0, PAGE_W, 110).fill(C.brand);

            // Logo — project public folder, then common local dev path
            const logoCandidates = [
                path.join(__dirname, '../public/logo.png'),
                path.join(__dirname, '../../BHRIBodhgaya-main/public/logo.png'),
                'C:/Users/pawan/Downloads/BHRIBodhgaya-main (1)/BHRIBodhgaya-main/public/logo.png'
            ];
            const logoPath = logoCandidates.find(p => fs.existsSync(p));
            const hasLogo = Boolean(logoPath);
            if (hasLogo) {
                doc.image(logoPath, MARGIN + 4, 22, { width: 52, height: 52 });
            }

            const textX = hasLogo ? MARGIN + 72 : MARGIN;
            const textW = hasLogo ? USABLE - 72 : USABLE;
            const align = hasLogo ? 'left' : 'center';

            // Hospital name
            doc.fillColor(C.white)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('Buddha Hospital And Research Institute', textX, 22, { width: textW, align });

            // Subtitle / Address
            doc.fillColor(C.light)
                .font('Helvetica')
                .fontSize(8)
                .text('Gaya-Dobhi Road, NH-22, Kharanti More, Tikuna Farm', textX, 42, { width: textW, align });
            doc.text('Gaya (Bihar) - 823004', textX, 52, { width: textW, align });

            // Tag line
            doc.fillColor('#93c5fd')
                .fontSize(8)
                .text('Phone: 8603048174 / 9060646592   |   Email: bhribodhgaya@gmail.com', textX, 66, { width: textW, align });

            // Appointment confirmation slip pill
            roundRect(doc, (PAGE_W - 200) / 2, 90, 200, 20, 4, '#2a5298');
            doc.fillColor(C.white).fontSize(9);
            drawSmart(doc, 'अपॉइंटमेंट पुष्टिकरण पर्ची', MARGIN, 95,
                { width: USABLE, align: 'center' }, true);

            // ── TOKEN NUMBER SECTION ──────────────────────────────────────────
            const tokenY = 120;
            roundRect(doc, MARGIN, tokenY, USABLE, 48, 6, C.light);

            // Label
            doc.fillColor(C.textMid).fontSize(9);
            drawSmart(doc, 'टोकन नंबर', MARGIN + 12, tokenY + 8, {}, false);

            // Big token number
            doc.fillColor(C.success)
                .font('Helvetica-Bold')
                .fontSize(30)
                .text(`#${String(appointment.tokenNumber).padStart(2, '0')}`, MARGIN + 12, tokenY + 18);

            // Status pill on right
            const statusColors = {
                confirmed: { bg: '#d1fae5', fg: '#065f46' },
                completed: { bg: '#dbeafe', fg: '#1e40af' },
                pending: { bg: '#fef3c7', fg: '#92400e' },
                cancelled: { bg: '#fee2e2', fg: '#991b1b' },
            };
            const sc = statusColors[appointment.status] || { bg: '#f3f4f6', fg: '#374151' };
            roundRect(doc, PAGE_W - MARGIN - 90, tokenY + 12, 90, 22, 11, sc.bg);
            doc.fillColor(sc.fg).fontSize(9);
            drawSmart(doc, STATUS_HI[appointment.status] || STATUS_HI.confirmed,
                PAGE_W - MARGIN - 90, tokenY + 17, { width: 90, align: 'center' }, true);

            // Appointment ID (small, top-right corner)
            doc.fillColor(C.textLight)
                .font('Helvetica')
                .fontSize(7)
                .text(`ID: ${appointment.appointmentId}`, MARGIN, tokenY + 38, { width: USABLE, align: 'right' });

            // ── DETAILS SECTION ───────────────────────────────────────────────
            const detailsY = 180;

            // Section label
            doc.fillColor(C.brand).fontSize(8);
            drawSmart(doc, 'मरीज़ व अपॉइंटमेंट विवरण', MARGIN, detailsY, {}, true);

            // Thin horizontal rule
            doc.moveTo(MARGIN, detailsY + 12)
                .lineTo(MARGIN + USABLE, detailsY + 12)
                .strokeColor(C.divider).lineWidth(0.5).stroke();

            const HALF = USABLE / 2 - 5;
            let gy = detailsY + 18;
            const ROW_H = 22;
            const LABEL_W = 64;

            // ── Build dynamic field list — skip anything the user did not fill.
            // Short fields render in a 2-column grid; long fields take a full row.
            const shortFields = [];
            const longFields = [];

            const addShort = (label, value) => {
                const v = clean(value);
                if (v) shortFields.push({ label, value: v });
            };
            const addLong = (label, value) => {
                const v = clean(value);
                if (v) longFields.push({ label, value: v });
            };

            addShort('मरीज़ का नाम', appointment.patientName);
            addShort('लिंग', toHiGender(appointment.gender));
            addShort('आयु', clean(appointment.age) ? `${appointment.age} वर्ष` : null);
            addShort('मोबाइल', appointment.mobile);
            addShort('आधार', appointment.aadhaar);
            addShort('ईमेल', appointment.email);
            addShort('विभाग', appointment.department?.name);
            addShort('डॉक्टर', appointment.doctor?.name);
            addShort('तारीख', appointment.date);
            addShort('समय', appointment.time);

            addLong('लक्षण', appointment.symptoms);
            addLong('पता', appointment.address);

            // ── Render short fields in a flowing 2-column grid ──────────────────
            let zebra = 0;
            for (let i = 0; i < shortFields.length; i += 2) {
                const left = shortFields[i];
                const right = shortFields[i + 1];

                roundRect(doc, MARGIN, gy, USABLE, ROW_H, 3, zebra % 2 === 0 ? '#f1f5f9' : C.white);

                const drawCell = (cell, gx, cellW) => {
                    if (!cell) return;
                    doc.fillColor(C.textMid).fontSize(7);
                    drawSmart(doc, cell.label + ':', gx + 4, gy + 6, { width: LABEL_W }, false);
                    doc.fillColor(C.textDark).fontSize(8);
                    drawSmart(doc, cell.value, gx + LABEL_W + 8, gy + 6,
                        { width: cellW - LABEL_W - 12, ellipsis: true, lineBreak: false }, true);
                };

                drawCell(left, MARGIN, HALF);
                drawCell(right, MARGIN + HALF + 10, HALF);

                gy += ROW_H;
                zebra++;
            }

            // ── Render long fields full width with auto height ──────────────────
            longFields.forEach((row) => {
                doc.fillColor(C.textDark).fontSize(7);
                (DEVANAGARI_RE.test(row.value) ? hi : en)(doc, true);
                const valueW = USABLE - LABEL_W - 18;
                const valueH = Math.max(
                    doc.heightOfString(row.value, { width: valueW }),
                    10
                );
                const rowH = Math.max(ROW_H, valueH + 12);

                roundRect(doc, MARGIN, gy, USABLE, rowH, 3, zebra % 2 === 0 ? '#f1f5f9' : C.white);

                doc.fillColor(C.textMid).fontSize(7);
                drawSmart(doc, row.label + ':', MARGIN + 6, gy + 6, { width: LABEL_W }, false);

                doc.fillColor(C.textDark).fontSize(7);
                drawSmart(doc, row.value, MARGIN + LABEL_W + 12, gy + 6,
                    { width: valueW }, true);

                gy += rowH;
                zebra++;
            });

            gy += 8; // padding before QR section

            // ── QR CODE + SCAN MESSAGE ─────────────────────────────────────────
            const QR_SIZE = 90;
            const qrX = MARGIN;
            const qrY = gy;

            roundRect(doc, MARGIN, qrY, USABLE, QR_SIZE + 20, 6, C.light);

            // QR section title
            doc.fillColor(C.brand).fontSize(8);
            drawSmart(doc, 'QR कोड स्कैन करें', MARGIN + 12, qrY + 8, {}, true);

            // QR image
            doc.image(qrBuffer, qrX + 8, qrY + 18, { width: QR_SIZE, height: QR_SIZE });

            // Instructions next to QR
            const instrX = qrX + QR_SIZE + 20;
            const instrW = USABLE - QR_SIZE - 28;

            doc.fillColor(C.textMid).fontSize(8);
            drawSmart(doc, 'अपॉइंटमेंट सत्यापित करने के लिए QR कोड स्कैन करें।',
                instrX, qrY + 20, { width: instrW });

            doc.fontSize(7);
            drawSmart(doc, '1. मोबाइल कैमरे से QR कोड स्कैन करें।', instrX, qrY + 44, { width: instrW });
            drawSmart(doc, '2. ब्राउज़र में अपॉइंटमेंट विवरण देखें।', instrX, qrY + 56, { width: instrW });
            drawSmart(doc, '3. अस्पताल रिसेप्शन पर यह पर्ची दिखाएँ।', instrX, qrY + 68, { width: instrW });

            doc.fillColor(C.textLight).fontSize(6.5);
            drawSmart(doc, `पर्ची आईडी: ${appointment.appointmentId}`,
                instrX, qrY + 92, { width: instrW });

            gy += QR_SIZE + 28;

            // ── IMPORTANT NOTICE ──────────────────────────────────────────────
            const noteY = gy + 4;
            roundRect(doc, MARGIN, noteY, USABLE, 28, 4, '#fef3c7');
            doc.fillColor('#92400e').fontSize(7);
            drawSmart(doc, 'महत्वपूर्ण सूचना:', MARGIN + 8, noteY + 5, {}, true);
            doc.fillColor('#78350f').fontSize(7);
            drawSmart(doc,
                'कृपया अपॉइंटमेंट से 15 मिनट पहले पहुँचें। वैध पहचान पत्र और यह पर्ची साथ लाएँ।',
                MARGIN + 68, noteY + 5, { width: USABLE - 76 });

            // ── FOOTER ─────────────────────────────────────────────────────────
            const footerY = PAGE_H - 34;
            doc.rect(0, footerY, PAGE_W, 34).fill(C.brand);

            doc.fillColor(C.light).font('Helvetica').fontSize(7)
                .text('BHRI Bodhgaya Hospital  |  Buddha Institute of Health Sciences  |  Bodhgaya, Bihar', MARGIN, footerY + 6, { width: USABLE, align: 'center' });

            doc.fillColor('#93c5fd').fontSize(6.5);
            drawSmart(doc,
                `जनरेट: ${new Date().toLocaleString('en-IN')}   |   यह कंप्यूटर जनित पर्ची है, हस्ताक्षर आवश्यक नहीं।`,
                MARGIN, footerY + 18, { width: USABLE, align: 'center' });

            doc.end();

        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateSlipPDF };