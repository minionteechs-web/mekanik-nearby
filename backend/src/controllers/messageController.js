const db = require('../config/db');
const { notifyUser } = require('../utils/socketLogic');
const { mapMessageUrls } = require('../utils/publicUrl');

const assertRequestParticipant = async (requestId, userId) => {
    const requestResult = await db.query(
        'SELECT driver_id, mechanic_id FROM service_requests WHERE id = $1',
        [requestId]
    );

    if (requestResult.rows.length === 0) {
        return { error: { status: 404, message: 'Service request not found' } };
    }

    const request = requestResult.rows[0];
    if (request.driver_id !== userId && request.mechanic_id !== userId) {
        return { error: { status: 403, message: 'Not authorized for this request' } };
    }

    return { request };
};

// @desc    Get message history for a service request
// @route   GET /api/messages/:requestId
// @access  Private
exports.getMessages = async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user.id;

    try {
        const access = await assertRequestParticipant(requestId, userId);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }

        const messagesQuery = `
            SELECT m.*, u.username as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.request_id = $1
            ORDER BY m.created_at ASC
        `;
        const messagesResult = await db.query(messagesQuery, [requestId]);

        res.json(messagesResult.rows.map((m) => mapMessageUrls(req, m)));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send a text message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    const { requestId, receiverId, content, messageType = 'text' } = req.body;
    const senderId = req.user.id;

    if (!requestId || !receiverId || !content) {
        return res.status(400).json({ message: 'requestId, receiverId, and content are required' });
    }

    try {
        const access = await assertRequestParticipant(requestId, senderId);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }

        const query = `
            INSERT INTO messages (request_id, sender_id, receiver_id, content, message_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(query, [requestId, senderId, receiverId, content, messageType]);
        const message = result.rows[0];

        const senderName = req.user.username || 'User';
        notifyUser(receiverId, 'new_message', {
            ...message,
            sender_name: senderName
        });

        res.status(201).json(mapMessageUrls(req, { ...message, sender_name: senderName }));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload media and send message
// @route   POST /api/messages/upload
// @access  Private
exports.uploadMedia = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { requestId, receiverId } = req.body;
    const senderId = req.user.id;
    const messageType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const fileUrl = `/uploads/${req.file.filename}`;

    if (!requestId || !receiverId) {
        return res.status(400).json({ message: 'requestId and receiverId are required' });
    }

    try {
        const access = await assertRequestParticipant(requestId, senderId);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }

        const query = `
            INSERT INTO messages (request_id, sender_id, receiver_id, content, message_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(query, [requestId, senderId, receiverId, fileUrl, messageType]);
        const message = result.rows[0];

        const senderName = req.user.username || 'User';
        notifyUser(receiverId, 'new_message', {
            ...message,
            sender_name: senderName
        });

        res.status(201).json(mapMessageUrls(req, { ...message, sender_name: senderName }));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
