const express = require('express');
const router = express.Router();
const {
    register,
    login,
    setup2FA,
    verify2FA,
    toggle2FA,
    forgotPassword,
    resetPassword,
    getMe,
    updateMe,
    changePassword,
    uploadAvatar,
    deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, uploadLimiter } = require('../middleware/rateLimit');
const avatarUpload = require('../config/avatarMulter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-2fa', authLimiter, verify2FA);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.delete('/me', protect, deleteAccount);
router.put('/change-password', protect, changePassword);
router.post('/me/avatar', protect, uploadLimiter, avatarUpload.single('avatar'), uploadAvatar);
router.post('/setup-2fa', protect, setup2FA);
router.post('/toggle-2fa', protect, toggle2FA);

module.exports = router;
