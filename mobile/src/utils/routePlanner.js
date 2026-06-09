import { mechanics } from './api';
import { geocodePlace, midpoint } from './geocode';
import { saveRouteOffline } from './storage';

const ROUTE_RADIUS_METERS = 80000;

const dedupeMechanics = (lists) => {
    const map = new Map();
    lists.flat().forEach((m) => { if (m?.id) map.set(m.id, m); });
    return Array.from(map.values());
};

export async function downloadRouteMechanics(startName, endName) {
    const start = await geocodePlace(startName);
    const end = await geocodePlace(endName);

    if (!start || !end) {
        throw new Error('Could not find locations. Try Lagos, Ibadan, Abuja, etc.');
    }

    const mid = midpoint(start, end);

    const [startRes, midRes, endRes] = await Promise.all([
        mechanics.getNearby(start.lat, start.lng, ROUTE_RADIUS_METERS),
        mechanics.getNearby(mid.lat, mid.lng, ROUTE_RADIUS_METERS),
        mechanics.getNearby(end.lat, end.lng, ROUTE_RADIUS_METERS),
    ]);

    const mechanicList = dedupeMechanics([startRes.data, midRes.data, endRes.data]);

    const payload = {
        route: {
            start: { name: startName, ...start },
            end: { name: endName, ...end },
            midpoint: mid,
            downloadedAt: new Date().toISOString(),
        },
        mechanics: mechanicList,
        count: mechanicList.length,
    };

    await saveRouteOffline(payload);
    return payload;
}
