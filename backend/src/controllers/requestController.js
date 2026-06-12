const db = require('../config/db');
const { notifyUser } = require('../utils/socketLogic');
const { createNotification } = require('./notificationController');

const VALID_STATUSES = ['pending', 'accepted', 'en-route', 'arrived', 'completed', 'cancelled'];
const ACTIVE_DRIVER_STATUSES = ['pending', 'accepted', 'en-route', 'arrived'];
const ACTIVE_MECHANIC_STATUSES = ['accepted', 'en-route', 'arrived'];

const ALLOWED_TRANSITIONS = {
    pending: ['accepted', 'cancelled'],
    accepted: ['en-route', 'cancelled'],
    'en-route': ['arrived', 'cancelled'],
    arrived: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

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
        const openRequest = await db.query(
            `SELECT id FROM service_requests
             WHERE driver_id = $1 AND status = ANY($2::varchar[])`,
            [driver_id, ACTIVE_DRIVER_STATUSES]
        );
        if (openRequest.rows.length > 0) {
            return res.status(409).json({
                message: 'You already have an active help request',
                requestId: openRequest.rows[0].id,
            });
        }

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
                SELECT sr.*, u.username as driver_name, u.phone as driver_phone
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
        const activeJob = await db.query(
            `SELECT id FROM service_requests
             WHERE mechanic_id = $1 AND status = ANY($2::varchar[])`,
            [mechanic_id, ACTIVE_MECHANIC_STATUSES]
        );
        if (activeJob.rows.length > 0) {
            return res.status(409).json({ message: 'Finish your current job before accepting another' });
        }

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

// @desc    Cancel a service request (driver)
// @route   PUT /api/requests/:id/cancel
// @access  Private (Driver)
exports.cancelRequest = async (req, res) => {
    const requestId = req.params.id;
    const driver_id = req.user.id;

    try {
        const result = await db.query(
            `UPDATE service_requests
             SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND driver_id = $2 AND status IN ('pending', 'accepted')
             RETURNING *`,
            [requestId, driver_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found or cannot be cancelled' });
        }

        const request = result.rows[0];
        notifyUser(request.mechanic_id, 'status_updated', request);
        await createNotification(
            request.mechanic_id,
            'request_cancelled',
            'Request cancelled',
            'The driver cancelled the help request.',
            { requestId: request.id }
        );

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update request status (en-route, arrived, completed)
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
        const current = await db.query(
            'SELECT status FROM service_requests WHERE id = $1 AND mechanic_id = $2',
            [requestId, mechanic_id]
        );

        if (current.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const currentStatus = current.rows[0].status;
        const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                message: `Cannot change status from "${currentStatus}" to "${status}"`,
            });
        }

        const query = `
            UPDATE service_requests
            SET status = $1, resolved_at = $2
            WHERE id = $3 AND mechanic_id = $4
            RETURNING *
        `;
        const resolvedAt = ['completed', 'cancelled'].includes(status) ? new Date() : null;
        const result = await db.query(query, [status, resolvedAt, requestId, mechanic_id]);

        const request = result.rows[0];
        notifyUser(request.driver_id, 'status_updated', request);
        await createNotification(request.driver_id, 'status_update', 'Request update', `Your request is now: ${status}`, { requestId: request.id, status });

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
