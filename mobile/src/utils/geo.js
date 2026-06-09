import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

export class LocationError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'LocationError';
        this.code = code;
    }
}

const LOCATION_MESSAGES = {
    denied: 'Location permission denied. Enable location for Mekanik Nearby in your phone settings.',
    disabled: 'Location services are turned off. Turn on GPS in your phone settings.',
    unavailable: 'Could not get a GPS fix. Try moving outdoors and try again.',
    timeout: 'Location request timed out. Please try again.',
};

export const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
};

const deg2rad = (deg) => deg * (Math.PI / 180);

export const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
    } else {
        Linking.openSettings();
    }
};

/** Request permission and verify GPS is enabled. Throws LocationError if not ready. */
export const ensureLocationReady = async () => {
    const { status: existing } = await Location.getForegroundPermissionsAsync();
    let status = existing;

    if (status !== 'granted') {
        const { status: requested } = await Location.requestForegroundPermissionsAsync();
        status = requested;
    }

    if (status !== 'granted') {
        throw new LocationError('denied', LOCATION_MESSAGES.denied);
    }

    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) {
        throw new LocationError('disabled', LOCATION_MESSAGES.disabled);
    }

    return true;
};

export const requestLocationPermissions = async () => {
    try {
        await ensureLocationReady();
        return true;
    } catch {
        return false;
    }
};

/** Returns real device GPS coordinates. Never falls back to Lagos. */
export const getCurrentLocation = async () => {
    await ensureLocationReady();

    try {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
        };
    } catch (primaryErr) {
        const last = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
        if (last?.coords?.latitude != null) {
            return {
                latitude: last.coords.latitude,
                longitude: last.coords.longitude,
                accuracy: last.coords.accuracy,
            };
        }

        const code = primaryErr?.message?.toLowerCase().includes('timeout') ? 'timeout' : 'unavailable';
        throw new LocationError(code, LOCATION_MESSAGES[code]);
    }
};

export const getNearestMechanic = (userLat, userLng, mechanics) => {
    if (!userLat || !userLng || !mechanics.length) return null;

    return mechanics
        .map((m) => ({
            ...m,
            distance_km: getDistance(userLat, userLng, m.lat, m.lng),
        }))
        .sort((a, b) => a.distance_km - b.distance_km)[0];
};

export const getLocationErrorMessage = (err) => {
    if (err instanceof LocationError) return err.message;
    return LOCATION_MESSAGES.unavailable;
};
