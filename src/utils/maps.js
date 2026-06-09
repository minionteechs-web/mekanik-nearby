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
