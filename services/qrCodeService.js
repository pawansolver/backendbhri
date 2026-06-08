/**
 * QR Code Service — BHRI Bodhgaya Hospital
 * Generates scan-able QR codes that point to the FRONTEND verification page.
 * When scanned, opens: FRONTEND_URL/appointment/verify/{appointmentId}
 */

const QRCode = require('qrcode');

// ─── Config ──────────────────────────────────────────────────────────────────
const getVerifyUrl = (appointmentId) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${FRONTEND_URL}/appointment/verify/${appointmentId}`;
};

const QR_OPTIONS = {
    errorCorrectionLevel: 'H',   // High — 30% recovery, better for print
    type:  'png',
    width: 300,
    margin: 2,
    color: {
        dark:  '#1a3a6b',         // BHRI brand navy
        light: '#ffffff',
    },
};

/**
 * Generate QR code as PNG Buffer — embed directly into PDFKit PDF.
 * @param {string} appointmentId  e.g. "BHRI-20260602-001"
 * @returns {Promise<Buffer>}      PNG image buffer
 */
const generateQRBuffer = async (appointmentId) => {
    return QRCode.toBuffer(getVerifyUrl(appointmentId), QR_OPTIONS);
};

/**
 * Generate QR code as base64 Data URL — for frontend <img> tag display.
 * @param {string} appointmentId
 * @returns {Promise<string>}  "data:image/png;base64,..."
 */
const generateQRDataUrl = async (appointmentId) => {
    return QRCode.toDataURL(getVerifyUrl(appointmentId), {
        ...QR_OPTIONS,
        type: 'image/png',
    });
};

/**
 * Get the plain verification URL encoded in the QR.
 * Used by notification services (WhatsApp, SMS, Email).
 * @param {string} appointmentId
 * @returns {string}
 */
const getVerificationUrl = (appointmentId) => getVerifyUrl(appointmentId);

module.exports = { generateQRBuffer, generateQRDataUrl, getVerificationUrl };
