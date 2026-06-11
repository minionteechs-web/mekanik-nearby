const express = require('express');
const router = express.Router();
const {
    getStats,
    getUsers,
    getPendingMechanics,
    verifyMechanic,
    getReports,
    resolveReport,
    getAllRequests,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/mechanics/pending', getPendingMechanics);
router.put('/mechanics/:id/verify', verifyMechanic);
router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);
router.get('/requests', getAllRequests);

module.exports = router;
