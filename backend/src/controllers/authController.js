const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');

/** TOTP verify with ±1 step tolerance for phone clock drift. */
const verifyTotp = (code, secret) => {
    if (!code || !secret) return false;
    const result = verifySync({
        secret,
        token: String(code).trim(),
        epochTolerance: 1,
    });
    return result.valid === true;
};
const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require('../utils/emailService');
const { sanitizeText } = require('../utils/sanitize');
require('dotenv').config();

const MECHANIC_SPECIALTIES = [
    'General Repairs',
    'Engine & Transmission',
    'Electrical & Battery',
    'Tires & Alignment',
    'AC & Cooling',
    'Bodywork & Welding',
];

const shapeUser = (row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone,
    role: row.role,
    is_2fa_enabled: row.is_2fa_enabled,
    avatar_url: row.avatar_url || null,
    terms_accepted_at: row.terms_accepted_at || null,
    emergency_contact_name: row.emergency_contact_name || null,
    emergency_contact_phone: row.emergency_contact_phone || null,
    vehicle_info: row.vehicle_info || {},
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const {
        username,
        email,
        password,
        phone,
        role,
        workshopName,
        specialty,
        city,
        state,
        yearsExperience,
        certification,
        termsAccepted,
    } = req.body;
    const userRole = ['driver', 'mechanic'].includes(role) ? role : 'driver';

    if (!termsAccepted) {
        return res.status(400).json({ message: 'You must accept the Terms of Service and Privacy Policy' });
    }

    if (!username?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (userRole === 'driver') {
        if (!phone?.trim()) {
            return res.status(400).json({
                message: 'Phone number is required so mechanics can reach you during roadside emergencies',
            });
        }
    }

    if (userRole === 'mechanic') {
        if (!phone?.trim()) {
            return res.status(400).json({ message: 'Business phone is required for driver callbacks' });
        }
        if (!workshopName?.trim() || !specialty?.trim() || !city?.trim()) {
            return res.status(400).json({
                message: 'Workshop name, specialty, and city are required to join as a mechanic',
            });
        }
        if (!MECHANIC_SPECIALTIES.includes(specialty.trim())) {
            return res.status(400).json({ message: 'Please select a valid specialty' });
        }
    }

    try {
        const userExists = await db.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email.trim(), username.trim()]
        );
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            `INSERT INTO users (username, email, password_hash, phone, role, terms_accepted_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
            [username.trim(), email.trim(), passwordHash, phone?.trim() || null, userRole]
        );

        const user = newUser.rows[0];

        if (userRole === 'mechanic') {
            const yrs = yearsExperience ? parseInt(yearsExperience, 10) : null;

            await db.query(
                `INSERT INTO mechanics (user_id, name, specialty, city, state, years_experience, certification, verification_status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
                [
                    user.id,
                    workshopName.trim(),
                    specialty.trim(),
                    city.trim(),
                    state?.trim() || null,
                    Number.isNaN(yrs) ? null : yrs,
                    sanitizeText(certification, 300) || null,
                ]
            );
        }

        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.status(201).json({
            user: shapeUser(user),
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if 2FA is enabled
        if (user.is_2fa_enabled) {
            // Generate a short-lived pre-auth token
            const preAuthToken = jwt.sign(
                { id: user.id, is_pre_auth: true },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            return res.json({
                two_factor_required: true,
                pre_auth_token: preAuthToken,
                user_id: user.id
            });
        }

        // Generate Final Token
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.json({
            user: shapeUser(user),
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Setup 2FA (Generate Secret & QR)
// @route   POST /api/auth/setup-2fa
// @access  Private
exports.setup2FA = async (req, res) => {
    try {
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        const user = userResult.rows[0];

        const secret = generateSecret();
        const otpauth = generateURI({
            issuer: 'Mekanik Nearby',
            label: user.email,
            secret,
        });

        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        // Store secret temporarily (not enabled yet)
        await db.query('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [secret, user.id]);

        res.json({
            secret,
            qrCodeUrl
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error setting up 2FA' });
    }
};

// @desc    Verify 2FA and Login
// @route   POST /api/auth/verify-2fa
// @access  Public
exports.verify2FA = async (req, res) => {
    const { token, code } = req.body;

    try {
        // Verify pre-auth token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.is_pre_auth) {
            return res.status(401).json({ message: 'Invalid verification session' });
        }

        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        const user = userResult.rows[0];

        if (!user.two_factor_secret) {
            return res.status(400).json({ message: '2FA not set up' });
        }

        if (!verifyTotp(code, user.two_factor_secret)) {
            return res.status(400).json({ message: 'Invalid 2FA code' });
        }

        // Generate Final Token
        const finalToken = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.json({
            user: shapeUser(user),
            token: finalToken,
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Verification session expired. Please login again.' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Enable/Disable 2FA
// @route   POST /api/auth/toggle-2fa
// @access  Private
exports.toggle2FA = async (req, res) => {
    const { enable, code } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        const user = userResult.rows[0];

        if (enable) {
            if (!user.two_factor_secret) {
                return res.status(400).json({ message: 'Please setup 2FA first' });
            }

            if (!verifyTotp(code, user.two_factor_secret)) {
                return res.status(400).json({ message: 'Invalid 2FA code' });
            }

            await db.query('UPDATE users SET is_2fa_enabled = true WHERE id = $1', [user.id]);
            res.json({ message: '2FA enabled successfully' });
        } else {
            if (!verifyTotp(code, user.two_factor_secret)) {
                return res.status(400).json({ message: 'Invalid 2FA code' });
            }
            await db.query('UPDATE users SET is_2fa_enabled = false, two_factor_secret = NULL WHERE id = $1', [user.id]);
            res.json({ message: '2FA disabled successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error toggling 2FA' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user: shapeUser(result.rows[0]) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res) => {
    const {
        username,
        phone,
        emergency_contact_name,
        emergency_contact_phone,
        vehicle_info,
    } = req.body;

    try {
        const current = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const row = current.rows[0];
        const nextUsername = username?.trim() || row.username;
        const nextPhone = phone !== undefined ? (phone?.trim() || null) : row.phone;
        const nextEmergencyName = emergency_contact_name !== undefined
            ? (sanitizeText(emergency_contact_name, 100) || null)
            : row.emergency_contact_name;
        const nextEmergencyPhone = emergency_contact_phone !== undefined
            ? (emergency_contact_phone?.trim() || null)
            : row.emergency_contact_phone;
        const nextVehicleInfo = vehicle_info !== undefined ? vehicle_info : row.vehicle_info;

        if (nextUsername.length < 2) {
            return res.status(400).json({ message: 'Username must be at least 2 characters' });
        }

        const duplicate = await db.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [nextUsername, req.user.id]
        );
        if (duplicate.rows.length > 0) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const updated = await db.query(
            `UPDATE users SET username = $1, phone = $2, emergency_contact_name = $3,
             emergency_contact_phone = $4, vehicle_info = $5 WHERE id = $6 RETURNING *`,
            [nextUsername, nextPhone, nextEmergencyName, nextEmergencyPhone, JSON.stringify(nextVehicleInfo || {}), req.user.id]
        );

        res.json({ user: shapeUser(updated.rows[0]) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Change password (logged in)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    try {
        const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload profile photo
// @route   POST /api/auth/me/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
    }

    try {
        const current = await db.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        const updated = await db.query(
            'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING *',
            [avatarUrl, req.user.id]
        );

        const oldUrl = current.rows[0].avatar_url;
        if (oldUrl?.startsWith('/uploads/avatars/')) {
            const oldPath = path.join(__dirname, '../../', oldUrl.replace(/^\//, ''));
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        res.json({ user: shapeUser(updated.rows[0]), avatar_url: avatarUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not save profile photo' });
    }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 60 * 60 * 1000);
            await db.query(
                'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
                [token, expires, result.rows[0].id]
            );

            const appUrl = process.env.APP_URL || 'http://localhost:5173';
            const resetUrl = `${appUrl}/reset-password?token=${token}`;

            await sendEmail({
                to: email,
                subject: 'Reset your Mekanik Nearby password',
                text: `Reset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.`,
                html: `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p><p>Expires in 1 hour.</p>`,
            });
        }

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const result = await db.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
            [token]
        );
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        await db.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
            [passwordHash, result.rows[0].id]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete account (NDPR self-service)
// @route   DELETE /api/auth/me
// @access  Private
exports.deleteAccount = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required to delete your account' });
    }

    try {
        const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, result.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
