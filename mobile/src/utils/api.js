import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEV_HOST}:5000/api`;
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || `http://${DEV_HOST}:5000`;

export const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = SOCKET_URL.replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getMediaBaseUrl = () => SOCKET_URL;

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
};

export const mechanics = {
    getNearby: (lat, lng, radiusMeters = 50000) =>
        api.get(`/mechanics/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`),
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

export const notifications = {
    getAll: () => api.get('/notifications'),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
};

let socket;

export const initSocket = async () => {
    const token = await AsyncStorage.getItem('token');
    const userJson = await AsyncStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    if (!user || !token) return null;

    if (socket?.connected) return socket;

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
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
