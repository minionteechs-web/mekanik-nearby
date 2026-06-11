const express = require('express');
const router = express.Router();
const { createReport, blockUser, unblockUser, getBlocks } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createReport);
router.post('/block', blockUser);
router.delete('/block/:userId', unblockUser);
router.get('/blocks', getBlocks);

module.exports = router;
