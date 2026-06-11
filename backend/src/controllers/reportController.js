const db = require('../config/db');
const { sanitizeText } = require('../utils/sanitize');

// @desc    Report a user
// @route   POST /api/reports
exports.createReport = async (req, res) => {
    const { reported_user_id, reason, details } = req.body;
    const reporter_id = req.user.id;

    if (!reported_user_id || !reason) {
        return res.status(400).json({ message: 'reported_user_id and reason are required' });
    }
    if (Number(reported_user_id) === Number(reporter_id)) {
        return res.status(400).json({ message: 'You cannot report yourself' });
    }

    try {
        const result = await db.query(
            `INSERT INTO user_reports (reporter_id, reported_user_id, reason, details)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [reporter_id, reported_user_id, sanitizeText(reason, 100), sanitizeText(details, 1000) || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Block a user
// @route   POST /api/reports/block
exports.blockUser = async (req, res) => {
    const { blocked_id } = req.body;
    const blocker_id = req.user.id;

    if (!blocked_id) {
        return res.status(400).json({ message: 'blocked_id is required' });
    }
    if (Number(blocked_id) === Number(blocker_id)) {
        return res.status(400).json({ message: 'You cannot block yourself' });
    }

    try {
        await db.query(
            `INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [blocker_id, blocked_id]
        );
        res.json({ message: 'User blocked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Unblock a user
// @route   DELETE /api/reports/block/:userId
exports.unblockUser = async (req, res) => {
    try {
        await db.query(
            'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
            [req.user.id, req.params.userId]
        );
        res.json({ message: 'User unblocked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    List blocked users
// @route   GET /api/reports/blocks
exports.getBlocks = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT u.id, u.username, u.email, b.created_at
             FROM user_blocks b
             JOIN users u ON b.blocked_id = u.id
             WHERE b.blocker_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
