const STORAGE_KEY = 'mekanik_theme_mode';

export const THEME_MODES = ['auto', 'light', 'dark'];

export function getStoredThemeMode() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return THEME_MODES.includes(stored) ? stored : 'auto';
    } catch {
        return 'auto';
    }
}

export function setStoredThemeMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
}

export function getSystemPrefersDark() {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(mode) {
    if (mode === 'auto') {
        return getSystemPrefersDark() ? 'dark' : 'light';
    }
    return mode;
}

export function applyDocumentTheme(resolved) {
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', resolved === 'dark' ? '#0F0F0F' : '#F8FAFC');
    }
}
