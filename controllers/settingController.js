const { AppSetting } = require('../models');

const OPD_TIMING_KEY = 'opd_timing';
const DEFAULT_OPD_TIMING = {
    morningStart: '09:00',
    morningEnd: '14:00',
    eveningStart: '16:00',
    eveningEnd: '19:00',
};

const parseValue = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return null; }
};

const getOPDTiming = async (req, res) => {
    try {
        const setting = await AppSetting.findOne({ where: { key: OPD_TIMING_KEY } });
        if (!setting) {
            return res.json({ success: true, data: DEFAULT_OPD_TIMING });
        }
        const parsed = parseValue(setting.value) || DEFAULT_OPD_TIMING;
        return res.json({ success: true, data: parsed });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const upsertOPDTiming = async (req, res) => {
    try {
        const payload = {
            morningStart: req.body.morningStart,
            morningEnd: req.body.morningEnd,
            eveningStart: req.body.eveningStart,
            eveningEnd: req.body.eveningEnd,
        };

        const existing = await AppSetting.findOne({ where: { key: OPD_TIMING_KEY } });
        if (existing) {
            await existing.update({ value: payload });
            return res.json({ success: true, message: 'OPD timing updated', data: payload });
        }

        await AppSetting.create({ key: OPD_TIMING_KEY, value: payload });
        return res.status(201).json({ success: true, message: 'OPD timing saved', data: payload });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getOPDTiming,
    upsertOPDTiming,
};
