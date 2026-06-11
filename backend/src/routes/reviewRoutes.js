const express = require('express');
const router = express.Router();
const { createReview, getMechanicReviews, getReviewEligibility } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/mechanic/:userId', getMechanicReviews);
router.get('/eligibility/:userId', protect, authorize('driver'), getReviewEligibility);
router.post('/', protect, authorize('driver'), createReview);

module.exports = router;
