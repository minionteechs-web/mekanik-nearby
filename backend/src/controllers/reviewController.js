const db = require('../config/db');

const updateMechanicRating = async (mechanicUserId) => {
    await db.query(
        `UPDATE mechanics SET
            rating = COALESCE((SELECT AVG(rating)::REAL FROM reviews WHERE mechanic_id = $1), 0),
            reviews_count = (SELECT COUNT(*) FROM reviews WHERE mechanic_id = $1)
         WHERE user_id = $1`,
        [mechanicUserId]
    );
};

exports.createReview = async (req, res) => {
    const { request_id, rating, comment } = req.body;
    const driver_id = req.user.id;

    if (!request_id) {
        return res.status(400).json({ message: 'request_id is required — reviews must be tied to a completed job' });
    }
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'rating (1-5) is required' });
    }

    try {
        const requestResult = await db.query(
            'SELECT * FROM service_requests WHERE id = $1 AND driver_id = $2 AND status = $3',
            [request_id, driver_id, 'completed']
        );

        if (requestResult.rows.length === 0) {
            return res.status(400).json({ message: 'Completed request not found. You can only review after a finished job.' });
        }

        const mechanicUserId = requestResult.rows[0].mechanic_id;

        const existing = await db.query(
            'SELECT id FROM reviews WHERE request_id = $1',
            [request_id]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Review already submitted for this request' });
        }

        const reviewResult = await db.query(
            `INSERT INTO reviews (request_id, driver_id, mechanic_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [request_id, driver_id, mechanicUserId, rating, comment || null]
        );

        await updateMechanicRating(mechanicUserId);

        res.status(201).json(reviewResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMechanicReviews = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await db.query(
            `SELECT r.*, u.username as driver_name
             FROM reviews r
             JOIN users u ON r.driver_id = u.id
             WHERE r.mechanic_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

/** Check if driver can review a mechanic (has completed unrated job) */
exports.getReviewEligibility = async (req, res) => {
    const { userId } = req.params;
    const driver_id = req.user.id;

    try {
        const result = await db.query(
            `SELECT sr.id as request_id
             FROM service_requests sr
             LEFT JOIN reviews r ON r.request_id = sr.id
             WHERE sr.driver_id = $1 AND sr.mechanic_id = $2 AND sr.status = 'completed' AND r.id IS NULL
             ORDER BY sr.resolved_at DESC LIMIT 1`,
            [driver_id, userId]
        );

        res.json({
            canReview: result.rows.length > 0,
            request_id: result.rows[0]?.request_id || null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
