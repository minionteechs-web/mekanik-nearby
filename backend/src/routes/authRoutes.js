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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);
router.post('/setup-2fa', protect, setup2FA);
router.post('/toggle-2fa', protect, toggle2FA);

module.exports = router;
