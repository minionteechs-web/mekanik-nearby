import { reverseGeocode } from './location';

const sampleAlongPath = (path, count = 6) => {
    if (!path?.length) return [];
    if (path.length <= count) return path;
    const samples = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.round((i / (count - 1)) * (path.length - 1));
        samples.push(path[idx]);
    }
    return samples;
};

export async function fetchElevationProfile(path) {
    const samples = sampleAlongPath(path, 8);
    if (!samples.length) return { points: [], minM: 0, maxM: 0, gainM: 0 };

    try {
        const locations = samples.map(([lat, lng]) => `${lat},${lng}`).join('|');
        const res = await fetch(
            `https://api.open-elevation.com/api/v1/lookup?locations=${locations}`,
            { headers: { Accept: 'application/json' } }
        );
        const data = await res.json();
        const elevations = (data?.results || []).map((r, i) => ({
            lat: samples[i][0],
            lng: samples[i][1],
            elevationM: Math.round(r.elevation || 0),
        }));

        const values = elevations.map((e) => e.elevationM);
        const minM = Math.min(...values);
        const maxM = Math.max(...values);
        let gainM = 0;
        for (let i = 1; i < values.length; i++) {
            const diff = values[i] - values[i - 1];
            if (diff > 0) gainM += diff;
        }

        return { points: elevations, minM, maxM, gainM: Math.round(gainM) };
    } catch (err) {
        console.warn('Elevation lookup failed:', err);
        return { points: [], minM: 0, maxM: 0, gainM: 0, unavailable: true };
    }
}

const REST_INTERVAL_KM = 120;

export async function suggestRestStops(route) {
    const { path, distanceKm, durationMin } = route;
    if (!path?.length || !distanceKm) return [];

    const stopCount = Math.min(4, Math.max(1, Math.floor(distanceKm / REST_INTERVAL_KM)));
    const fractions = Array.from({ length: stopCount }, (_, i) => (i + 1) / (stopCount + 1));
    const stops = [];

    for (let i = 0; i < fractions.length; i++) {
        const frac = fractions[i];
        const idx = Math.round(frac * (path.length - 1));
        const [lat, lng] = path[idx];
        const kmFromStart = Math.round(distanceKm * frac);

        let label = `Rest area (~${kmFromStart} km)`;
        try {
            label = await reverseGeocode(lat, lng);
        } catch {
            /* keep default */
        }

        const driveMinSoFar = durationMin ? Math.round(durationMin * frac) : null;

        stops.push({
            id: `stop-${i + 1}`,
            label,
            lat,
            lng,
            kmFromStart,
            driveMinSoFar,
            tip: i === 0
                ? 'Good first break — stretch, fuel check, network signal.'
                : i === fractions.length - 1
                    ? 'Last major stop before destination — food & rest recommended.'
                    : 'Highway rest point — verify mechanic coverage offline.',
        });
    }

    return stops;
}

export async function enrichRouteInsights(route) {
    const [elevation, restStops] = await Promise.all([
        fetchElevationProfile(route.path),
        suggestRestStops(route),
    ]);
    return { elevation, restStops };
}
