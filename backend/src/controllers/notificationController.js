const db = require('../config/db');
const { notifyUser } = require('../utils/socketLogic');
const { pushToUser } = require('../utils/pushService');

const createNotification = async (userId, type, title, body, data = {}) => {
    try {
        const result = await db.query(
            `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, type, title, body, JSON.stringify(data)]
        );
        const notification = result.rows[0];

        notifyUser(userId, 'notification', notification);
        await pushToUser(userId, { title, body, data: { ...data, type } });

        return notification;
    } catch (err) {
        console.error('Notification insert failed:', err);
        return null;
    }
};

exports.createNotification = createNotification;

exports.getNotifications = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
            [req.user.id]
        );
        res.json({ count: result.rows[0].count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.markRead = async (req, res) => {
    try {
        await db.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await db.query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
            [req.user.id]
        );
        res.json({ message: 'All marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.registerPushToken = async (req, res) => {
    const { token, platform = 'expo' } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Push token is required' });
    }

    try {
        await db.query(
            `INSERT INTO push_tokens (user_id, token, platform) VALUES ($1, $2, $3)
             ON CONFLICT (user_id, token) DO NOTHING`,
            [req.user.id, token, platform]
        );
        res.json({ message: 'Push token registered' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.removePushToken = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Push token is required' });
    }

    try {
        await db.query(
            'DELETE FROM push_tokens WHERE user_id = $1 AND token = $2',
            [req.user.id, token]
        );
        res.json({ message: 'Push token removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
