const db = require('../config/db');
const { createNotification } = require('./notificationController');
const { notifyUser } = require('../utils/socketLogic');
const { sanitizeText } = require('../utils/sanitize');

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

// @desc    Create a scheduled booking
// @route   POST /api/bookings
// @access  Private (Driver)
exports.createBooking = async (req, res) => {
    const { mechanic_id, scheduled_at, service_type, notes, address, lat, lng } = req.body;
    const driver_id = req.user.id;

    if (!mechanic_id || !scheduled_at || !service_type) {
        return res.status(400).json({ message: 'mechanic_id, scheduled_at, and service_type are required' });
    }

    const scheduledDate = new Date(scheduled_at);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return res.status(400).json({ message: 'scheduled_at must be a future date/time' });
    }

    try {
        const mechanicCheck = await db.query(
            `SELECT u.id FROM users u JOIN mechanics m ON m.user_id = u.id WHERE u.id = $1 AND u.role = 'mechanic'`,
            [mechanic_id]
        );
        if (mechanicCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Mechanic not found' });
        }

        const result = await db.query(
            `INSERT INTO bookings (driver_id, mechanic_id, scheduled_at, service_type, notes, address, lat, lng)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                driver_id,
                mechanic_id,
                scheduledDate,
                sanitizeText(service_type, 100),
                sanitizeText(notes, 500) || null,
                sanitizeText(address, 300) || null,
                lat ?? null,
                lng ?? null,
            ]
        );

        const booking = result.rows[0];
        notifyUser(mechanic_id, 'new_booking', booking);
        await createNotification(
            mechanic_id,
            'new_booking',
            'New booking request',
            `A driver booked ${service_type} for ${scheduledDate.toLocaleString()}`,
            { bookingId: booking.id }
        );

        res.status(201).json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    List my bookings
// @route   GET /api/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query;
        if (role === 'mechanic') {
            query = `
                SELECT b.*, u.username as driver_name, u.phone as driver_phone
                FROM bookings b
                JOIN users u ON b.driver_id = u.id
                WHERE b.mechanic_id = $1
                ORDER BY b.scheduled_at ASC
            `;
        } else {
            query = `
                SELECT b.*, m.name as mechanic_name, m.id as mechanic_profile_id
                FROM bookings b
                LEFT JOIN mechanics m ON m.user_id = b.mechanic_id
                WHERE b.driver_id = $1
                ORDER BY b.scheduled_at ASC
            `;
        }

        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
    const bookingId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` });
    }

    try {
        const existing = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const booking = existing.rows[0];
        const isDriver = role === 'driver' && Number(booking.driver_id) === Number(userId);
        const isMechanic = role === 'mechanic' && Number(booking.mechanic_id) === Number(userId);

        if (!isDriver && !isMechanic) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (status === 'cancelled' && !isDriver && !isMechanic) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (status === 'confirmed' && !isMechanic) {
            return res.status(403).json({ message: 'Only the mechanic can confirm bookings' });
        }
        if (status === 'completed' && !isMechanic) {
            return res.status(403).json({ message: 'Only the mechanic can mark bookings complete' });
        }

        const result = await db.query(
            `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [status, bookingId]
        );

        const updated = result.rows[0];
        const notifyTarget = isDriver ? booking.mechanic_id : booking.driver_id;
        notifyUser(notifyTarget, 'booking_updated', updated);
        await createNotification(
            notifyTarget,
            'booking_updated',
            'Booking updated',
            `Booking status: ${status}`,
            { bookingId: updated.id, status }
        );

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
