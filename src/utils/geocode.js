// Nigerian city coordinates (fallback when offline or geocoder unavailable)
const NIGERIAN_CITIES = {
    lagos: { lat: 6.5244, lng: 3.3792, label: 'Lagos' },
    ibadan: { lat: 7.3775, lng: 3.947, label: 'Ibadan' },
    abuja: { lat: 9.0765, lng: 7.3986, label: 'Abuja' },
    kano: { lat: 12.0022, lng: 8.592, label: 'Kano' },
    port: { lat: 4.8156, lng: 7.0498, label: 'Port Harcourt' },
    'port harcourt': { lat: 4.8156, lng: 7.0498, label: 'Port Harcourt' },
    benin: { lat: 6.335, lng: 5.6037, label: 'Benin City' },
    'benin city': { lat: 6.335, lng: 5.6037, label: 'Benin City' },
    enugu: { lat: 6.4584, lng: 7.5464, label: 'Enugu' },
    kaduna: { lat: 10.5105, lng: 7.4165, label: 'Kaduna' },
    jos: { lat: 9.8965, lng: 8.8583, label: 'Jos' },
    warri: { lat: 5.516, lng: 5.75, label: 'Warri' },
    onitsha: { lat: 6.1498, lng: 6.7857, label: 'Onitsha' },
    abeokuta: { lat: 7.1608, lng: 3.3483, label: 'Abeokuta' },
};

const normalizeKey = (name) => name.trim().toLowerCase().replace(/,/g, '');

export async function geocodePlace(name) {
    if (!name?.trim()) return null;

    const key = normalizeKey(name);
    if (NIGERIAN_CITIES[key]) {
        return { ...NIGERIAN_CITIES[key], source: 'preset' };
    }

    // Partial match on preset cities
    const preset = Object.entries(NIGERIAN_CITIES).find(([k]) => key.includes(k) || k.includes(key));
    if (preset) {
        return { ...preset[1], source: 'preset' };
    }

    try {
        const query = encodeURIComponent(`${name.trim()}, Nigeria`);
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'MekanikNearby/1.0' } }
        );
        const data = await res.json();
        if (data?.[0]) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                label: data[0].display_name.split(',')[0],
                source: 'nominatim',
            };
        }
    } catch (err) {
        console.warn('Geocode failed:', err);
    }

    return null;
}

export function midpoint(a, b) {
    return {
        lat: (a.lat + b.lat) / 2,
        lng: (a.lng + b.lng) / 2,
        label: 'Mid-route',
    };
}
