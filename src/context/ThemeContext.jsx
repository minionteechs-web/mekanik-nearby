import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
    applyDocumentTheme,
    getStoredThemeMode,
    getSystemPrefersDark,
    resolveTheme,
    setStoredThemeMode,
} from '../utils/themeManager';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [mode, setModeState] = useState(getStoredThemeMode);
    const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

    const resolved = useMemo(() => resolveTheme(mode), [mode, systemDark]);
    const isDark = resolved === 'dark';

    useEffect(() => {
        applyDocumentTheme(resolved);
    }, [resolved]);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e) => setSystemDark(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const setMode = (next) => {
        setStoredThemeMode(next);
        setModeState(next);
    };

    const value = useMemo(
        () => ({ mode, setMode, resolved, isDark }),
        [mode, resolved, isDark]
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
