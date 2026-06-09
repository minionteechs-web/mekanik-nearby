const db = require('../config/db');
const { notifyUser } = require('../utils/socketLogic');
const { createNotification } = require('./notificationController');

const VALID_STATUSES = ['pending', 'accepted', 'en-route', 'arrived', 'completed', 'cancelled'];

// @desc    Create a new service request (SOS)
// @route   POST /api/requests
// @access  Private (Driver)
exports.createRequest = async (req, res) => {
    const { mechanic_id, lat, lng } = req.body;
    const driver_id = req.user.id;

    if (!mechanic_id || lat == null || lng == null) {
        return res.status(400).json({ message: 'mechanic_id, lat, and lng are required' });
    }

    try {
        const mechanicCheck = await db.query(
            `SELECT u.id FROM users u
             JOIN mechanics m ON m.user_id = u.id
             WHERE u.id = $1 AND u.role = 'mechanic' AND m.is_available = TRUE`,
            [mechanic_id]
        );

        if (mechanicCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Mechanic not found or unavailable' });
        }

        const query = `
            INSERT INTO service_requests (driver_id, mechanic_id, driver_lat, driver_lng, status)
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING *
        `;
        const result = await db.query(query, [driver_id, mechanic_id, lat, lng]);
        const request = result.rows[0];

        notifyUser(mechanic_id, 'new_request', request);
        await createNotification(mechanic_id, 'new_request', 'New SOS Request', 'A driver needs roadside help nearby.', { requestId: request.id });

        res.status(201).json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get requests for the logged-in user
// @route   GET /api/requests/my-requests
// @access  Private
exports.getMyRequests = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query;
        if (role === 'mechanic') {
            query = `
                SELECT sr.*, u.username as driver_name
                FROM service_requests sr
                JOIN users u ON sr.driver_id = u.id
                WHERE sr.mechanic_id = $1
                ORDER BY sr.requested_at DESC
            `;
        } else {
            query = `
                SELECT sr.*, m.name as mechanic_name, m.id as mechanic_profile_id
                FROM service_requests sr
                LEFT JOIN mechanics m ON m.user_id = sr.mechanic_id
                WHERE sr.driver_id = $1
                ORDER BY sr.requested_at DESC
            `;
        }

        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Accept a service request
// @route   PUT /api/requests/:id/accept
// @access  Private (Mechanic)
exports.acceptRequest = async (req, res) => {
    const requestId = req.params.id;
    const mechanic_id = req.user.id;

    try {
        const query = `
            UPDATE service_requests
            SET status = 'accepted'
            WHERE id = $1 AND mechanic_id = $2 AND status = 'pending'
            RETURNING *
        `;
        const result = await db.query(query, [requestId, mechanic_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found or already accepted' });
        }

        const request = result.rows[0];
        notifyUser(request.driver_id, 'request_accepted', request);
        await createNotification(request.driver_id, 'request_accepted', 'Help is on the way', 'A mechanic accepted your SOS request.', { requestId: request.id });

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update request status (en-route, completed)
// @route   PUT /api/requests/:id/status
// @access  Private (Mechanic)
exports.updateStatus = async (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;
    const mechanic_id = req.user.id;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` });
    }

    try {
        const query = `
            UPDATE service_requests
            SET status = $1, resolved_at = $2
            WHERE id = $3 AND mechanic_id = $4
            RETURNING *
        `;
        const resolvedAt = status === 'completed' ? new Date() : null;
        const result = await db.query(query, [status, resolvedAt, requestId, mechanic_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = result.rows[0];
        notifyUser(request.driver_id, 'status_updated', request);
        await createNotification(request.driver_id, 'status_update', 'Request update', `Your request is now: ${status}`, { requestId: request.id, status });

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
