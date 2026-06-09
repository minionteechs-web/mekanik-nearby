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

// @desc    Submit a review
// @route   POST /api/reviews
// @access  Private (Driver)
exports.createReview = async (req, res) => {
    const { request_id, mechanic_id, rating, comment } = req.body;
    const driver_id = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'rating (1-5) is required' });
    }

    try {
        let mechanicUserId = mechanic_id;

        if (request_id) {
            const requestResult = await db.query(
                'SELECT * FROM service_requests WHERE id = $1 AND driver_id = $2 AND status = $3',
                [request_id, driver_id, 'completed']
            );

            if (requestResult.rows.length === 0) {
                return res.status(400).json({ message: 'Completed request not found' });
            }

            mechanicUserId = requestResult.rows[0].mechanic_id;

            const existing = await db.query(
                'SELECT id FROM reviews WHERE request_id = $1',
                [request_id]
            );
            if (existing.rows.length > 0) {
                return res.status(400).json({ message: 'Review already submitted for this request' });
            }
        } else if (mechanic_id) {
            const mechanicCheck = await db.query(
                "SELECT id FROM users WHERE id = $1 AND role = 'mechanic'",
                [mechanic_id]
            );
            if (mechanicCheck.rows.length === 0) {
                return res.status(400).json({ message: 'Mechanic not found' });
            }
        } else {
            return res.status(400).json({ message: 'request_id or mechanic_id is required' });
        }

        const reviewResult = await db.query(
            `INSERT INTO reviews (request_id, driver_id, mechanic_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [request_id || null, driver_id, mechanicUserId, rating, comment || null]
        );

        await updateMechanicRating(mechanicUserId);

        res.status(201).json(reviewResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get reviews for a mechanic (by user id)
// @route   GET /api/reviews/mechanic/:userId
// @access  Public
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
