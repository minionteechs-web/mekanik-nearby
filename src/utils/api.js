import axios from 'axios';
import { io } from 'socket.io-client';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = SOCKET_URL.replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('mekanik_user') || '{}');
    if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

export const auth = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    verify2FA: (data) => api.post('/auth/verify-2fa', data),
    setup2FA: () => api.post('/auth/setup-2fa'),
    toggle2FA: (data) => api.post('/auth/toggle-2fa', data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    getMe: () => api.get('/auth/me'),
    updateMe: (data) => api.put('/auth/me', data),
    changePassword: (data) => api.put('/auth/change-password', data),
    uploadAvatar: (formData) =>
        api.post('/auth/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

export const notifications = {
    getAll: () => api.get('/notifications'),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
};

export const mechanics = {
    getNearby: (lat, lng, radiusKm = 50) =>
        api.get(`/mechanics/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}`),
    getDetail: (id) => api.get(`/mechanics/${id}`),
    onboard: (data) => api.post('/mechanics/onboard', data),
    getMyProfile: () => api.get('/mechanics/me/profile'),
    updateAvailability: (is_available) =>
        api.put('/mechanics/me/availability', { is_available }),
};

export const requests = {
    create: (data) => api.post('/requests', data),
    getUserRequests: () => api.get('/requests/my-requests'),
    accept: (id) => api.put(`/requests/${id}/accept`),
    cancel: (id) => api.put(`/requests/${id}/cancel`),
    updateStatus: (id, status) => api.put(`/requests/${id}/status`, { status }),
};

export const messages = {
    getHistory: (requestId) => api.get(`/messages/${requestId}`),
    send: (data) => api.post('/messages', data),
    upload: (formData) =>
        api.post('/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

export const reviews = {
    create: (data) => api.post('/reviews', data),
    getForMechanic: (userId) => api.get(`/reviews/mechanic/${userId}`),
};

let socket;

export const initSocket = () => {
    const user = JSON.parse(localStorage.getItem('mekanik_user') || '{}');
    if (!user.token) return null;

    if (socket?.connected) return socket;

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    socket = io(SOCKET_URL, {
        auth: { token: user.token },
        autoConnect: true,
    });

    const joinRoom = () => {
        if (user.id) socket.emit('join', user.id);
    };

    if (socket.connected) {
        joinRoom();
    } else {
        socket.on('connect', joinRoom);
    }

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export default api;
