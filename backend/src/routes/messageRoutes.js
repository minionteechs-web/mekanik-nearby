const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, uploadMedia } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// All messaging routes are protected
router.use(protect);

router.get('/:requestId', getMessages);
router.post('/', sendMessage);
router.post('/upload', upload.single('media'), uploadMedia);

module.exports = router;
