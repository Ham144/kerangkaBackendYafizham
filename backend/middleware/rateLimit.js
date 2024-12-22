const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5, // maksimal 5 percobaan
    message: {
        message: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit'
    }
});

module.exports = { loginLimiter }; 