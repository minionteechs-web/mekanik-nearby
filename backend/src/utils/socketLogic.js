const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

let io;

const init = (server) => {
    io = socketIO(server, {
        cors: {
            origin: '*',
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.is_pre_auth) {
                return next(new Error('Complete 2FA verification first'));
            }
            socket.userId = decoded.id;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id, 'userId:', socket.userId);

        socket.join(`user_${socket.userId}`);

        socket.on('join', (userId) => {
            if (parseInt(userId, 10) === socket.userId) {
                socket.join(`user_${userId}`);
            }
        });

        socket.on('typing', (data) => {
            if (!data?.receiverId) return;
            io.to(`user_${data.receiverId}`).emit('typing', {
                sender_id: data.senderId,
                request_id: Number(data.request_id),
            });
        });

        socket.on('call_user', (data) => {
            io.to(`user_${data.to}`).emit('call_user', {
                offer: data.offer,
                from: data.from,
                signalType: data.signalType,
            });
        });

        socket.on('call_accepted', (data) => {
            io.to(`user_${data.to}`).emit('call_accepted', data.answer);
        });

        socket.on('ice_candidate', (data) => {
            io.to(`user_${data.to}`).emit('ice_candidate', data.candidate);
        });

        socket.on('hangup', (data) => {
            io.to(`user_${data.to}`).emit('hangup');
        });

        const { setupTracking } = require('./trackingLogic');
        setupTracking(socket);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const notifyUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

module.exports = { init, getIO, notifyUser };
