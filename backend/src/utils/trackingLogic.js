const db = require('../config/db');
const { getIO } = require('./socketLogic');

const setupTracking = (socket) => {
    socket.on('location_update', async (data) => {
        const { driverId, lat, lng, requestId } = data;
        if (!driverId || lat == null || lng == null || !requestId) return;

        try {
            const result = await db.query(
                'SELECT mechanic_id, status FROM service_requests WHERE id = $1',
                [requestId]
            );

            if (result.rows.length === 0) return;

            const request = result.rows[0];
            if (Number(request.mechanic_id) !== Number(socket.userId)) return;
            if (!['accepted', 'en-route', 'arrived'].includes(request.status)) return;

            const io = getIO();
            io.to(`user_${driverId}`).emit('mechanic_location', {
                requestId,
                lat,
                lng,
            });
        } catch (err) {
            console.error('location_update error:', err);
        }
    });
};

module.exports = { setupTracking };
