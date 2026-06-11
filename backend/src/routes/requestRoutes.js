const express = require('express');
const router = express.Router();
const {
    createRequest,
    getMyRequests,
    getIncomingRequests,
    getRequestById,
    acceptRequest,
    cancelRequest,
    updateStatus,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sosLimiter } = require('../middleware/rateLimit');

router.use(protect);

router.get('/my-requests', getMyRequests);
router.get('/incoming', authorize('mechanic'), getIncomingRequests);
router.get('/:id', getRequestById);
router.post('/', authorize('driver'), sosLimiter, createRequest);
router.put('/:id/accept', authorize('mechanic'), acceptRequest);
router.put('/:id/cancel', authorize('driver'), cancelRequest);
router.put('/:id/status', authorize('mechanic'), updateStatus);

module.exports = router;
