const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, updateBookingStatus } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyBookings);
router.post('/', authorize('driver'), createBooking);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
