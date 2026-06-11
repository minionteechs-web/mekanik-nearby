import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSocket, disconnectSocket } from './api';
import { registerForPushNotifications } from './pushNotifications';
import { refreshUserLocation } from './location';
import { initI18n } from './i18n';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize everything on boot
        const initialize = async () => {
            console.log("[Auth] Starting Initialization...");
            try {
                console.log("[Auth] Initializing i18n...");
                await initI18n();
                console.log("[Auth] Checking AsyncStorage for user...");
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    console.log("[Auth] User found:", userJson);
                    const userData = JSON.parse(userJson);
                    setUser(userData);
                    console.log("[Auth] Initializing Socket...");
                    await initSocket();
                    registerForPushNotifications().catch(() => {});
                } else {
                    console.log("[Auth] No user found in storage.");
                }
            } catch (e) {
                console.error("[Auth] Init Error:", e);
            } finally {
                console.log("[Auth] Initialization complete, setting loading to false.");
                setLoading(false);
            }
        };
        initialize();
    }, []);

    const login = async (userData, token) => {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        await initSocket();
        registerForPushNotifications().catch(() => {});
        refreshUserLocation().catch(() => {});
    };

    const logout = async () => {
        disconnectSocket();
        await AsyncStorage.multiRemove(['token', 'user']);
        setUser(null);
    };

    const updateUser = async (partial) => {
        if (!user) return null;
        const next = { ...user, ...partial };
        await AsyncStorage.setItem('user', JSON.stringify(next));
        setUser(next);
        return next;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
