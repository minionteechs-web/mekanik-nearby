import { mechanics } from './api';
import { geocodePlace, midpoint } from './geocode';
import { fetchRouteGeometry } from './routeGeometry';
import { enrichRouteInsights } from './routeInsights';
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
    const geometry = await fetchRouteGeometry(start, end);

    const points = [
        { lat: start.lat, lng: start.lng },
        { lat: mid.lat, lng: mid.lng },
        { lat: end.lat, lng: end.lng },
    ];

    const results = await Promise.allSettled(
        points.map((p) => mechanics.getNearby(p.lat, p.lng, ROUTE_RADIUS_METERS))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length === results.length) {
        const first = failed[0].reason;
        throw new Error(first?.response?.data?.message || first?.message || 'Could not reach server');
    }

    const mechanicList = dedupeMechanics(
        results.filter((r) => r.status === 'fulfilled').map((r) => r.value.data)
    );

    const route = {
        start: { name: startName, ...start },
        end: { name: endName, ...end },
        midpoint: mid,
        path: geometry.path,
        distanceKm: geometry.distanceKm,
        durationMin: geometry.durationMin,
        routeSource: geometry.source,
        steps: geometry.steps,
        downloadedAt: new Date().toISOString(),
    };

    const insights = await enrichRouteInsights({ ...route, start: route.start, end: route.end });

    const payload = {
        route: { ...route, ...insights },
        mechanics: mechanicList,
        count: mechanicList.length,
    };

    const saved = await saveRouteOffline(payload);
    return saved;
}
