import { darkColors } from './themes';

/** @deprecated Prefer useTheme().colors in components */
export const COLORS = darkColors;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 9999,
};

export const SHADOW = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 8,
    },
    fab: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 12,
    },
};

export const TYPO = {
    display: { fontSize: 28, fontWeight: '800' },
    title: { fontSize: 22, fontWeight: '700' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 13, fontWeight: '500' },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
};
