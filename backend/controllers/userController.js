const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');

const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }  // Token utama berlaku 15 menit
    );

    const refreshToken = jwt.sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }   // Refresh token berlaku 7 hari
    );

    return { accessToken, refreshToken };
};

const userController = {
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            // Cek apakah user sudah ada
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            })


            if (existingUser) {
                return res.status(400).json({
                    message: 'Username atau email sudah terdaftar'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Buat user baru
            const user = new User({
                username,
                email,
                password: hashedPassword
            });

            await user.save();

            res.status(201).json({
                message: 'Registrasi berhasil'
            });

        } catch (error) {
            res.status(500).json({
                message: 'Terjadi kesalahan',
                error: error.message
            });
        }
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            // Cari user
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(400).json({
                    message: 'Username atau password salah'
                });
            }

            // Verifikasi password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({
                    message: 'Username atau password salah'
                });
            }

            const deviceId = req.headers['x-device-id']; // Frontend mengirim unique device ID

            const accessToken = jwt.sign(
                {
                    id: user._id,
                    deviceId // Tambahkan deviceId ke token
                },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { id: user._id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );

            // Simpan refresh token di database
            await User.findByIdAndUpdate(user._id, {
                refreshToken: refreshToken
            });

            // Kirim kedua token
            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });

        } catch (error) {
            res.status(500).json({
                message: 'Terjadi kesalahan',
                error: error.message
            });
        }
    },

    refresh: async (req, res) => {
        const { refreshToken } = req.body;

        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await User.findById(decoded.id);

            if (!user || user.refreshToken !== refreshToken) {
                return res.status(401).json({
                    message: 'Token tidak valid'
                });
            }

            const newAccessToken = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.json({ accessToken: newAccessToken });
        } catch (error) {
            res.status(401).json({
                message: 'Token tidak valid'
            });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.userId)
                .select('-password -refreshToken');

            if (!user) {
                return res.status(404).json({
                    message: 'User tidak ditemukan'
                });
            }

            res.json(user);
        } catch (error) {
            res.status(500).json({
                message: 'Terjadi kesalahan',
                error: error.message
            });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { username, email } = req.body;

            const user = await User.findByIdAndUpdate(
                req.userId,
                { username, email },
                { new: true }
            ).select('-password -refreshToken');

            res.json({
                message: 'Profile berhasil diupdate',
                user
            });
        } catch (error) {
            res.status(500).json({
                message: 'Terjadi kesalahan',
                error: error.message
            });
        }
    },

    logout: async (req, res) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            // Blacklist token
            await new BlacklistedToken({ token }).save();

            // Hapus refresh token dari user
            await User.findByIdAndUpdate(req.userId, {
                refreshToken: null
            });

            res.json({ message: 'Logout berhasil' });
        } catch (error) {
            res.status(500).json({
                message: 'Terjadi kesalahan',
                error: error.message
            });
        }
    }
};

module.exports = userController; 