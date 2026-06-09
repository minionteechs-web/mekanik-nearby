const express = require('express');
const router = express.Router();
const { createReview, getMechanicReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('driver'), createReview);
router.get('/mechanic/:userId', getMechanicReviews);

module.exports = router;
