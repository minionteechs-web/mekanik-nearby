export const openGoogleMaps = (lat, lng, label = '') => {
    const q = label ? `${lat},${lng} (${encodeURIComponent(label)})` : `${lat},${lng}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
};

export const openDirections = (fromLat, fromLng, toLat, toLng) => {
    window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`,
        '_blank'
    );
};

export const getGoogleMapsUrl = (lat, lng) => `https://maps.google.com/?q=${lat},${lng}`;

export const openRouteInGoogleMaps = (start, end) => {
    if (!start?.lat || !end?.lat) return;
    window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&travelmode=driving`,
        '_blank',
        'noopener,noreferrer'
    );
};

export const openRestStopInGoogleMaps = (stop) => {
    if (!stop?.lat) return;
    openGoogleMaps(stop.lat, stop.lng, stop.label);
};
