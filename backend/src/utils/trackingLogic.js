const { getIO } = require('./socketLogic');

const setupTracking = (socket) => {
    // Listen for location updates from mechanics
    socket.on('location_update', (data) => {
        const { driverId, lat, lng, requestId } = data;
        const io = getIO();

        // Forward the location to the specific driver's room
        io.to(`user_${driverId}`).emit('mechanic_location', {
            requestId,
            lat,
            lng
        });
    });
};

module.exports = { setupTracking };
