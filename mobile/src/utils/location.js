import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getCurrentLocation, LocationError, ensureLocationReady } from './geo';

const CACHE_KEY = 'mekanik_user_location';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

// Re-export shared reverse geocode logic inline to avoid extra file
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

const nearestCityLabel = (lat, lng) => {
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

export { LocationError };

export const resolveUserLocation = async () => {
    const coords = await getCurrentLocation();
    const label = await reverseGeocode(coords.latitude, coords.longitude);
    return {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        label,
        source: 'gps',
    };
};

export const cacheUserLocation = async (location) => {
    if (!location || location.source !== 'gps') return;
    if (location.lat == null || location.lng == null) return;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        ...location,
        cachedAt: new Date().toISOString(),
    }));
};

export const clearCachedUserLocation = async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
};

export const getCachedUserLocation = async () => {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed.source !== 'gps' || parsed.label?.includes('(default)')) {
            await clearCachedUserLocation();
            return null;
        }
        if (parsed.cachedAt) {
            const age = Date.now() - new Date(parsed.cachedAt).getTime();
            if (age > CACHE_MAX_AGE_MS) return null;
        }
        return parsed;
    } catch {
        await clearCachedUserLocation();
        return null;
    }
};

export const refreshUserLocation = async () => {
    const location = await resolveUserLocation();
    await cacheUserLocation(location);
    return location;
};

export const getLocationErrorMessage = (err) => {
    if (err instanceof LocationError) return err.message;
    return 'Could not determine your location. Enable GPS and try again.';
};

export const watchUserLocation = async (onUpdate) => {
    try {
        await ensureLocationReady();
    } catch {
        return () => {};
    }

    const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 15 },
        async (loc) => {
            let label = 'Your current position (GPS)';
            try {
                label = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
            } catch {
                /* offline */
            }
            onUpdate({
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                accuracy: loc.coords.accuracy,
                label,
                source: 'gps',
            });
        }
    );

    return () => subscription.remove();
};
