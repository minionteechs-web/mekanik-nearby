import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Calculates the Haversine distance between two points on the Earth.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in km
 */
export const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(1);
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

export const requestLocationPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
};

export const getCurrentLocation = async () => {
    try {
        if (Platform.OS === 'web') {
            // Web location is sometimes slow/blocked, return Lagos default
            return { latitude: 6.5244, longitude: 3.3792 };
        }
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        return location.coords;
    } catch (error) {
        console.warn("Location error:", error);
        return { latitude: 6.5244, longitude: 3.3792 }; // Default to Lagos on failure
    }
};

export const getNearestMechanic = (userLat, userLng, mechanics) => {
    if (!userLat || !userLng || !mechanics.length) return null;

    return mechanics
        .map(m => ({
            ...m,
            distance_km: getDistance(userLat, userLng, m.lat, m.lng)
        }))
        .sort((a, b) => a.distance_km - b.distance_km)[0];
};
