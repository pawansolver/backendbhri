const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =============================================
// ⚠️  TESTING MODE — TOKEN VALIDATION BYPASSED
//     Restore karein: neeche wala block hatayen
//     aur upar wala uncomment karein
// =============================================

const protect = async (req, res, next) => {
    // --- TESTING BYPASS START ---
    return next();
    // --- TESTING BYPASS END ---

    // --- ORIGINAL VALIDATION (restore karna ho to yeh uncomment karein) ---
    // try {
    //     let token;
    //     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //         token = req.headers.authorization.split(' ')[1];
    //     }
    //
    //     if (!token) {
    //         return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    //     }
    //
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //     req.user = await User.findByPk(decoded.id);
    //
    //     if (!req.user) {
    //         return res.status(401).json({ success: false, message: 'User not found' });
    //     }
    //
    //     next();
    // } catch (error) {
    //     return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    // }
};

module.exports = { protect };
