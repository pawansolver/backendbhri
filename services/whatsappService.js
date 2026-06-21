/**
 * WhatsApp & Notification Service — BHRI Bodhgaya Hospital
 *
 * Tier 1 (Current):   wa.me deep-link — free, no API key, user clicks to send.
 * Tier 2 (Future):    Twilio WhatsApp API / SMS / Email — auto-send.
 */

const { getVerificationUrl } = require('./qrCodeService');

// ─────────────────────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

/**
 * Sanitise a mobile number to E.164 format without leading '+'.
 */
const sanitiseMobile = (mobile) => {
    if (!mobile) return null;
    let clean = String(mobile).replace(/[\s\-\.\(\)]/g, '');
    if (clean.startsWith('+')) clean = clean.slice(1);
    if (clean.startsWith('0091')) clean = clean.slice(4);
    if (clean.startsWith('91') && clean.length === 12) return clean;
    if (clean.length === 10) return `91${clean}`;
    if (clean.startsWith('0') && clean.length === 11) return `91${clean.slice(1)}`;
    return clean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Message Generator (For WhatsApp, SMS, Email)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a clean, professional, production-grade message string.
 * @param {object} appointment  Full appointment instance
 * @param {string} slipUrl      Public PDF slip download URL
 * @returns {string}            Formatted message body
 */
const generateWhatsAppAppointmentMessage = (appointment, slipUrl) => {
    const verifyUrl = getVerificationUrl(appointment.appointmentId);
    const tokenStr = `#${String(appointment.tokenNumber).padStart(2, '0')}`;
    const doctorName = appointment.doctor?.name || 'Assigned Doctor';
    const deptName = appointment.department?.name || 'Assigned Department';

    const formattedDate = formatDate(appointment.date);
    const formattedTime = formatTime(appointment.time);

    const lines = [
        `*BUDDHA HOSPITAL AND RESEARCH INSTITUTE*`,
        `https://bhrimedicalcollege.com/`,
        `GAYA-DOBHI ROAD, NH-22, KHARANTI MORE, GAYA-823004`,
        ``,
        `Dear ${appointment.patientName},`,
        ``,
        `Your appointment has been successfully confirmed.`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `*Appointment Details*`,
        ``,
        `• Token No: ${tokenStr}`,
        `• Appointment ID: ${appointment.appointmentId}`,
        `• Doctor: ${doctorName}`,
        `• Department: ${deptName}`,
        `• Date: ${formattedDate}`,
        `• Time: ${formattedTime}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `*Verify Appointment*`,
        verifyUrl,
        ``,
        `*Download Appointment Slip*`,
        slipUrl,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `*Instructions*`,
        ``,
        `• Arrive 15 minutes before appointment time.`,
        `• Carry a valid ID proof.`,
        `• Show this message at reception.`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `*BHRI Bodhgaya Hospital*`,
        `Gaya-Dobhi Road, NH-22, Gaya`,
        ``,
        `Phone: 8603048174 | 9060646592`,
        ``,
        `Thank you for choosing BHRI Bodhgaya Hospital.`,
        `Wishing you good health.`
    ];

    return lines.join('\n');
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier 1: wa.me deep-link
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a WhatsApp wa.me deep-link.
 */
const buildWhatsappLink = (appointment, slipUrl) => {
    const wa = sanitiseMobile(appointment.mobile);
    if (!wa) return null;

    const message = generateWhatsAppAppointmentMessage(appointment, slipUrl);
    return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    buildWhatsappLink,
    generateWhatsAppAppointmentMessage,
    sanitiseMobile,
};
