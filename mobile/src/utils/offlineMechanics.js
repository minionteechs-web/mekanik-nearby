import { getAllCachedMechanics } from './storage';

const toRad = (deg) => (deg * Math.PI) / 180;

export const haversineMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function rankMechanicsByGps(mechanics, lat, lng) {
    if (!mechanics?.length || lat == null || lng == null) return mechanics || [];

    return mechanics
        .filter((m) => m.lat != null && m.lng != null)
        .map((m) => ({
            ...m,
            distance_meters: Math.round(haversineMeters(lat, lng, m.lat, m.lng)),
            fromOfflineCache: true,
        }))
        .sort((a, b) => a.distance_meters - b.distance_meters);
}

export async function getOfflineMechanicsNear(lat, lng) {
    const cached = await getAllCachedMechanics();
    return rankMechanicsByGps(cached, lat, lng);
}

export async function getNearestOfflineMechanic(lat, lng) {
    const ranked = await getOfflineMechanicsNear(lat, lng);
    return ranked[0] || null;
}
