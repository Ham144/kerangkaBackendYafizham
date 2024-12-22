const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const deviceId = req.headers['x-device-id'];

        if (!token || !deviceId) {
            return res.status(401).json({
                message: 'Akses ditolak!'
            });
        }

        // Cek apakah token di blacklist
        const isBlacklisted = await BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({
                message: 'Token tidak valid'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verifikasi device
        if (decoded.deviceId !== deviceId) {
            return res.status(401).json({
                message: 'Device tidak valid'
            });
        }

        req.userId = decoded.id;
        next();

    } catch (error) {
        res.status(401).json({
            message: 'Token tidak valid atau kadaluarsa'
        });
    }
};

module.exports = auth; 