const express = require('express');
const router = express.Router();
const { createRequest, getMyRequests, acceptRequest, updateStatus } = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-requests', protect, getMyRequests);
router.post('/', protect, authorize('driver'), createRequest);
router.put('/:id/accept', protect, authorize('mechanic'), acceptRequest);
router.put('/:id/status', protect, authorize('mechanic'), updateStatus);

module.exports = router;
