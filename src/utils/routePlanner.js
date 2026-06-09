import { mechanics as mechanicsApi } from './api';
import { geocodePlace, midpoint } from './geocode'; // midpoint kept for route.midpoint in payload
import { fetchRouteGeometry } from './routeGeometry';
import { enrichRouteInsights } from './routeInsights';
import { saveRoute } from './routeStorage';

const ROUTE_RADIUS_KM = 80;

const sampleAlongPath = (path, count = 6) => {
    if (!path?.length) return [];
    if (path.length <= count) return path.map(([lat, lng]) => ({ lat, lng }));
    const samples = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.round((i / (count - 1)) * (path.length - 1));
        const [lat, lng] = path[idx];
        samples.push({ lat, lng });
    }
    return samples;
};

const dedupeMechanics = (lists) => {
    const map = new Map();
    lists.flat().forEach((m) => { if (m?.id) map.set(m.id, m); });
    return Array.from(map.values());
};

export async function downloadRouteMechanics(startName, endName) {
    const start = await geocodePlace(startName);
    const end = await geocodePlace(endName);

    if (!start || !end) {
        throw new Error('Could not find one or both locations. Try major city names like Lagos, Ibadan, Abuja.');
    }

    const geometry = await fetchRouteGeometry(start, end);
    const mid = midpoint(start, end);

    const points = sampleAlongPath(geometry.path, 6);

    const results = await Promise.allSettled(
        points.map((p) => mechanicsApi.getNearby(p.lat, p.lng, ROUTE_RADIUS_KM))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length === results.length) {
        const first = failed[0].reason;
        throw new Error(first?.response?.data?.message || first?.message || 'Could not reach server');
    }

    const mechanics = dedupeMechanics(
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
        mechanics,
        count: mechanics.length,
    };

    const saved = await saveRoute(payload);
    return saved;
}
