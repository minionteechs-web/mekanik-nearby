const db = require('../config/db');
const { sanitizeText } = require('../utils/sanitize');

// @desc    Platform stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const [users, mechanics, requests, bookings, reports] = await Promise.all([
            db.query("SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL"),
            db.query("SELECT COUNT(*)::int AS count FROM mechanics"),
            db.query("SELECT COUNT(*)::int AS count FROM service_requests WHERE status NOT IN ('completed','cancelled')"),
            db.query("SELECT COUNT(*)::int AS count FROM bookings WHERE status IN ('pending','confirmed')"),
            db.query("SELECT COUNT(*)::int AS count FROM user_reports WHERE status = 'open'"),
        ]);

        res.json({
            users: users.rows[0].count,
            mechanics: mechanics.rows[0].count,
            active_requests: requests.rows[0].count,
            upcoming_bookings: bookings.rows[0].count,
            open_reports: reports.rows[0].count,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    List users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, username, email, phone, role, created_at, terms_accepted_at, deleted_at
             FROM users ORDER BY created_at DESC LIMIT 100`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mechanics pending verification
// @route   GET /api/admin/mechanics/pending
exports.getPendingMechanics = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT m.*, u.email, u.phone, u.username
             FROM mechanics m
             JOIN users u ON m.user_id = u.id
             WHERE m.verification_status = 'pending'
             ORDER BY m.last_updated DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify or reject mechanic
// @route   PUT /api/admin/mechanics/:id/verify
exports.verifyMechanic = async (req, res) => {
    const { status, note } = req.body;
    const mechanicProfileId = req.params.id;

    if (!['verified', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'status must be verified, rejected, or pending' });
    }

    try {
        const result = await db.query(
            `UPDATE mechanics SET verification_status = $1, verification_note = $2, last_updated = CURRENT_TIMESTAMP
             WHERE id = $3 RETURNING *`,
            [status, sanitizeText(note, 500) || null, mechanicProfileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    List open reports
// @route   GET /api/admin/reports
exports.getReports = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT r.*, rep.username as reporter_name, tgt.username as reported_name
             FROM user_reports r
             JOIN users rep ON r.reporter_id = rep.id
             JOIN users tgt ON r.reported_user_id = tgt.id
             ORDER BY r.created_at DESC LIMIT 100`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Resolve report
// @route   PUT /api/admin/reports/:id
exports.resolveReport = async (req, res) => {
    const { status } = req.body;
    if (!['open', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const result = await db.query(
            'UPDATE user_reports SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    All SOS requests (monitoring)
// @route   GET /api/admin/requests
exports.getAllRequests = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT sr.*, du.username as driver_name, mu.username as mechanic_name
             FROM service_requests sr
             LEFT JOIN users du ON sr.driver_id = du.id
             LEFT JOIN users mu ON sr.mechanic_id = mu.id
             ORDER BY sr.requested_at DESC LIMIT 100`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
