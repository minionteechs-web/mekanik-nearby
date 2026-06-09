import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../constants/themes';

const STORAGE_KEY = 'mekanik_theme_mode';
export const THEME_MODES = ['auto', 'light', 'dark'];

const ThemeContext = createContext(null);

function resolveTheme(mode, systemScheme) {
    if (mode === 'auto') {
        return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
}

export function ThemeProvider({ children }) {
    const [mode, setModeState] = useState('auto');
    const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'dark');

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
            if (THEME_MODES.includes(stored)) setModeState(stored);
        });
    }, []);

    useEffect(() => {
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemScheme(colorScheme || 'dark');
        });
        return () => sub.remove();
    }, []);

    const resolved = useMemo(
        () => resolveTheme(mode, systemScheme),
        [mode, systemScheme]
    );
    const isDark = resolved === 'dark';
    const colors = isDark ? darkColors : lightColors;

    const setMode = async (next) => {
        setModeState(next);
        await AsyncStorage.setItem(STORAGE_KEY, next);
    };

    const value = useMemo(
        () => ({ mode, setMode, resolved, isDark, colors }),
        [mode, resolved, isDark, colors]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return ctx;
}
