const express = require('express');
const router = express.Router();
const {
    getNearbyMechanics,
    onboardMechanic,
    getMechanicById,
    getMyProfile,
    updateAvailability,
} = require('../controllers/mechanicController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/nearby', getNearbyMechanics);
router.get('/me/profile', protect, authorize('mechanic'), getMyProfile);
router.put('/me/availability', protect, authorize('mechanic'), updateAvailability);
router.post('/onboard', protect, authorize('mechanic'), onboardMechanic);
router.get('/:id', getMechanicById);

module.exports = router;
