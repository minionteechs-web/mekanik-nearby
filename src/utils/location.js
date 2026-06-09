import { geocodePlace } from './geocode';

const NIGERIAN_CITIES = {
    lagos: { lat: 6.5244, lng: 3.3792, label: 'Lagos' },
    ibadan: { lat: 7.3775, lng: 3.947, label: 'Ibadan' },
    abuja: { lat: 9.0765, lng: 7.3986, label: 'Abuja' },
    enugu: { lat: 6.4584, lng: 7.5464, label: 'Enugu' },
    kano: { lat: 12.0022, lng: 8.592, label: 'Kano' },
    'port harcourt': { lat: 4.8156, lng: 7.0498, label: 'Port Harcourt' },
};

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
            const city = a.city || a.town || a.village || a.state_district || a.county;
            const state = a.state;
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
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
            }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
        );
    });

export const resolveUserLocation = async () => {
    try {
        const coords = await getCurrentPosition();
        const label = await reverseGeocode(coords.lat, coords.lng);
        return { ...coords, label, source: 'gps' };
    } catch {
        const fallback = await geocodePlace('Lagos');
        return {
            lat: fallback.lat,
            lng: fallback.lng,
            label: `${fallback.label}, Nigeria (default)`,
            source: 'default',
        };
    }
};

export const cacheUserLocation = (location) => {
    localStorage.setItem('mekanik_user_location', JSON.stringify({
        ...location,
        cachedAt: new Date().toISOString(),
    }));
};

export const getCachedUserLocation = () => {
    const raw = localStorage.getItem('mekanik_user_location');
    return raw ? JSON.parse(raw) : null;
};
