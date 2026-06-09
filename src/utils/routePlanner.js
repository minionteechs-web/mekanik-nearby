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

    const points = [
        { label: 'start', lat: start.lat, lng: start.lng },
        { label: 'mid', lat: mid.lat, lng: mid.lng },
        { label: 'end', lat: end.lat, lng: end.lng },
    ];

    const results = await Promise.allSettled(
        points.map((p) => mechanicsApi.getNearby(p.lat, p.lng, ROUTE_RADIUS_KM))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length === results.length) {
        const first = failed[0].reason;
        const msg = first?.response?.data?.message || first?.message || 'Could not reach server';
        throw new Error(msg);
    }

    const mechanics = dedupeMechanics(
        results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value.data)
    );

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
