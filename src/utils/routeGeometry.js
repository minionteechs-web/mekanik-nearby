import { geocodePlace, midpoint } from './geocode';
import { enrichRouteInsights } from './routeInsights';

const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatManeuver = (step) => {
    const m = step.maneuver || {};
    const road = step.name || 'the road';
    const mod = m.modifier ? `${m.modifier.replace(/_/g, ' ')} ` : '';

    switch (m.type) {
        case 'depart':
            return `Head ${mod}on ${road}`;
        case 'arrive':
            return 'Arrive at your destination';
        case 'turn':
            return `Turn ${mod}onto ${road}`;
        case 'continue':
        case 'new name':
            return `Continue on ${road}`;
        case 'merge':
            return `Merge ${mod}onto ${road}`;
        case 'on ramp':
            return `Take the ramp ${mod}onto ${road}`;
        case 'off ramp':
            return `Take the exit ${mod}onto ${road}`;
        case 'fork':
            return `At the fork, keep ${mod}onto ${road}`;
        case 'roundabout':
            return `At the roundabout, take exit onto ${road}`;
        case 'rotary':
            return `Enter the rotary and exit onto ${road}`;
        case 'end of road':
            return `At road end, turn ${mod}onto ${road}`;
        default:
            return road !== 'the road' ? `Continue on ${road}` : 'Continue on route';
    }
};

const parseSteps = (route) => {
    const steps = route?.legs?.[0]?.steps || [];
    return steps.map((step, index) => ({
        id: index + 1,
        instruction: formatManeuver(step),
        road: step.name || '',
        distanceM: Math.round(step.distance || 0),
        distanceLabel: step.distance >= 1000
            ? `${(step.distance / 1000).toFixed(1)} km`
            : `${Math.round(step.distance)} m`,
        durationMin: Math.max(1, Math.round((step.duration || 0) / 60)),
    })).filter((s) => s.distanceM > 0 || s.instruction.includes('Arrive'));
};

const straightFallback = (start, end) => {
    const mid = midpoint(start, end);
    const distanceKm = Math.round(haversineKm(start.lat, start.lng, end.lat, end.lng) * 10) / 10;
    return {
        path: [[start.lat, start.lng], [mid.lat, mid.lng], [end.lat, end.lng]],
        distanceKm,
        durationMin: Math.round((distanceKm / 60) * 60),
        source: 'estimate',
        steps: [
            { id: 1, instruction: `Depart ${start.label || start.name}`, road: '', distanceM: 0, distanceLabel: '—', durationMin: 0 },
            { id: 2, instruction: `Continue toward ${end.label || end.name}`, road: 'Highway', distanceM: distanceKm * 1000, distanceLabel: `${distanceKm} km`, durationMin: Math.round((distanceKm / 60) * 60) },
            { id: 3, instruction: 'Arrive at your destination', road: end.label || end.name, distanceM: 0, distanceLabel: '—', durationMin: 0 },
        ],
        rawRoute: null,
    };
};

/** Fetch driving route from OSRM (free). Falls back to straight line. */
export async function fetchRouteGeometry(start, end) {
    try {
        const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
        const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`,
            { headers: { Accept: 'application/json' } }
        );
        const data = await res.json();
        if (data?.code !== 'Ok' || !data.routes?.[0]) {
            return straightFallback(start, end);
        }

        const route = data.routes[0];
        const path = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const steps = parseSteps(route);

        return {
            path,
            distanceKm: Math.round((route.distance / 1000) * 10) / 10,
            durationMin: Math.round(route.duration / 60),
            source: 'osrm',
            steps,
            rawRoute: route,
        };
    } catch (err) {
        console.warn('OSRM route failed, using estimate:', err);
        return straightFallback(start, end);
    }
}

export async function planRoute(startName, endName) {
    const start = await geocodePlace(startName);
    const end = await geocodePlace(endName);

    if (!start || !end) {
        throw new Error('Could not find one or both locations. Try Lagos, Ibadan, Enugu, Abuja.');
    }

    const geometry = await fetchRouteGeometry(start, end);
    const mid = midpoint(start, end);

    const base = {
        start: { name: startName, ...start },
        end: { name: endName, ...end },
        midpoint: mid,
        ...geometry,
    };

    const insights = await enrichRouteInsights(base);
    return { ...base, ...insights };
}
