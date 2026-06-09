import { geocodePlace } from './geocode';

const NIGERIAN_CITIES = {
    lagos: { lat: 6.5244, lng: 3.3792, label: 'Lagos' },
    ibadan: { lat: 7.3775, lng: 3.947, label: 'Ibadan' },
    abuja: { lat: 9.0765, lng: 7.3986, label: 'Abuja' },
    enugu: { lat: 6.4584, lng: 7.5464, label: 'Enugu' },
    kano: { lat: 12.0022, lng: 8.592, label: 'Kano' },
    'port harcourt': { lat: 4.8156, lng: 7.0498, label: 'Port Harcourt' },
};

const CACHE_KEY = 'mekanik_user_location';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

const toRad = (deg) => (deg * Math.PI) / 180;

const distanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export class LocationError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'LocationError';
        this.code = code;
    }
}

export const nearestCityLabel = (lat, lng) => {
    let best = { label: 'Nigeria', dist: Infinity };
    Object.values(NIGERIAN_CITIES).forEach((city) => {
        const dist = distanceKm(lat, lng, city.lat, city.lng);
        if (dist < best.dist) best = { label: city.label, dist };
    });
    return best.label;
};

export const reverseGeocode = async (lat, lng) => {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'MekanikNearby/1.0' } }
        );
        const data = await res.json();
        if (data?.address) {
            const a = data.address;
            const city = a.city || a.town || a.village || a.state_district || a.county || a.suburb;
            const state = a.state || a.region;
            if (city && state) return `${city}, ${state}`;
            if (city) return city;
            if (state) return state;
        }
    } catch (err) {
        console.warn('Reverse geocode failed:', err);
    }
    return `${nearestCityLabel(lat, lng)}, Nigeria`;
};

export const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new LocationError('unsupported', 'Geolocation is not supported in this browser.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
            }),
            (err) => {
                const code = err.code === 1 ? 'denied'
                    : err.code === 2 ? 'unavailable'
                        : err.code === 3 ? 'timeout'
                            : 'error';
                const messages = {
                    denied: 'Location permission denied. Allow location access in your browser settings.',
                    unavailable: 'GPS signal unavailable. Try moving outdoors or enabling device location.',
                    timeout: 'Location request timed out. Please try again.',
                    error: err.message || 'Could not read your location.',
                };
                reject(new LocationError(code, messages[code]));
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    });

export const resolveUserLocation = async () => {
    const coords = await getCurrentPosition();
    const label = await reverseGeocode(coords.lat, coords.lng);
    return { ...coords, label, source: 'gps' };
};

export const cacheUserLocation = (location) => {
    if (!location || location.source !== 'gps') return;
    if (location.lat == null || location.lng == null) return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...location,
        cachedAt: new Date().toISOString(),
    }));
};

export const clearCachedUserLocation = () => {
    localStorage.removeItem(CACHE_KEY);
};

export const getCachedUserLocation = () => {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed.source !== 'gps' || parsed.label?.includes('(default)')) {
            clearCachedUserLocation();
            return null;
        }
        if (parsed.cachedAt) {
            const age = Date.now() - new Date(parsed.cachedAt).getTime();
            if (age > CACHE_MAX_AGE_MS) return null;
        }
        return parsed;
    } catch {
        clearCachedUserLocation();
        return null;
    }
};

/** Always requests fresh GPS — never falls back to Lagos. */
export const refreshUserLocation = async () => {
    const location = await resolveUserLocation();
    cacheUserLocation(location);
    return location;
};

export const getLocationErrorMessage = (err) => {
    if (err instanceof LocationError) return err.message;
    return 'Could not determine your location. Enable GPS and try again.';
};

/** Live GPS updates — works offline (satellite only). */
export const watchUserLocation = (onUpdate) => {
    if (!('geolocation' in navigator)) return () => {};

    const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
            let label = 'Your current position (GPS)';
            try {
                label = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            } catch {
                /* offline label is fine */
            }
            onUpdate({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                label,
                source: 'gps',
            });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
};
