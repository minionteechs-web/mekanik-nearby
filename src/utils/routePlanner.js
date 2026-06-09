import { mechanics as mechanicsApi } from './api';
import { geocodePlace, midpoint } from './geocode';
import { saveOfflineData } from './offline';

const ROUTE_RADIUS_KM = 80;

const dedupeMechanics = (lists) => {
    const map = new Map();
    lists.flat().forEach((m) => {
        if (m?.id) map.set(m.id, m);
    });
    return Array.from(map.values());
};

export async function downloadRouteMechanics(startName, endName) {
    const start = await geocodePlace(startName);
    const end = await geocodePlace(endName);

    if (!start || !end) {
        throw new Error('Could not find one or both locations. Try major city names like Lagos, Ibadan, Abuja.');
    }

    const mid = midpoint(start, end);

    const [startMechs, midMechs, endMechs] = await Promise.all([
        mechanicsApi.getNearby(start.lat, start.lng, ROUTE_RADIUS_KM),
        mechanicsApi.getNearby(mid.lat, mid.lng, ROUTE_RADIUS_KM),
        mechanicsApi.getNearby(end.lat, end.lng, ROUTE_RADIUS_KM),
    ]);

    const mechanics = dedupeMechanics([
        startMechs.data,
        midMechs.data,
        endMechs.data,
    ]);

    const payload = {
        route: {
            start: { name: startName, ...start },
            end: { name: endName, ...end },
            midpoint: mid,
            downloadedAt: new Date().toISOString(),
        },
        mechanics,
        count: mechanics.length,
    };

    await saveOfflineData('mechanics_route', payload);
    localStorage.setItem('mekanik_offline_meta', JSON.stringify({
        routeLabel: `${start.label || startName} → ${end.label || endName}`,
        count: mechanics.length,
        downloadedAt: payload.route.downloadedAt,
        sizeBytes: new Blob([JSON.stringify(payload)]).size,
    }));

    return payload;
}
