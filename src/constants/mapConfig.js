// OpenStreetMap-based tiles — no API key required
export const MAP_TILES = {
    // Dark roads + bright street/junction labels (best for live feel)
    live: {
        base: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
        },
        labels: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
            subdomains: 'abcd',
            maxZoom: 20,
        },
    },
    // Light roads + dark labels — mirrors live style for light mode
    liveLight: {
        base: {
            url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
        },
        labels: {
            url: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
            subdomains: 'abcd',
            maxZoom: 20,
        },
    },
    // Single-layer fallback — full colour with road names
    voyager: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    },
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    },
    streets: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    },
};

export const DEFAULT_CENTER = [6.5244, 3.3792];
export const DEFAULT_ZOOM = 16;
export const MIN_LABEL_ZOOM = 15;

/** Pick live map tiles that match the app theme (live = dark, liveLight = light). */
export function resolveMapStyle(mapStyle, isDark) {
    if (mapStyle === 'live' || mapStyle === 'auto') {
        return isDark ? 'live' : 'liveLight';
    }
    return mapStyle;
}
