const express = require('express');
const router = express.Router();
const {
    getNearbyMechanics,
    onboardMechanic,
    getMechanicById,
    getMyProfile,
    updateAvailability,
    submitVerification,
    getServiceCatalog,
    updateServiceCatalog,
} = require('../controllers/mechanicController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/nearby', getNearbyMechanics);
router.get('/catalog/:userId', getServiceCatalog);

router.get('/me/profile', protect, authorize('mechanic'), getMyProfile);
router.put('/me/availability', protect, authorize('mechanic'), updateAvailability);
router.post('/onboard', protect, authorize('mechanic'), onboardMechanic);
router.post('/me/verification', protect, authorize('mechanic'), submitVerification);
router.put('/me/catalog', protect, authorize('mechanic'), updateServiceCatalog);

router.get('/:id', getMechanicById);

module.exports = router;
