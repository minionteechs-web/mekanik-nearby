const db = require('../config/db');

const createNotification = async (userId, type, title, body, data = {}) => {
    try {
        await db.query(
            `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5)`,
            [userId, type, title, body, JSON.stringify(data)]
        );
    } catch (err) {
        console.error('Notification insert failed:', err);
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
