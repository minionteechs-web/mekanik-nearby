const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
    registerPushToken,
    removePushToken,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.post('/push-token', registerPushToken);
router.delete('/push-token', removePushToken);

module.exports = router;
