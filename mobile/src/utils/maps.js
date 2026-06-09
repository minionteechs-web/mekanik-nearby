import { Linking, Platform } from 'react-native';

export const openGoogleMaps = (lat, lng, label = '') => {
    const q = label ? `${lat},${lng} (${label})` : `${lat},${lng}`;
    const url = Platform.select({
        ios: `maps:0,0?q=${q}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label || 'Location')})`,
        default: `https://maps.google.com/?q=${lat},${lng}`,
    });
    Linking.openURL(url);
};

export const openDirections = (fromLat, fromLng, toLat, toLng) => {
    const url = Platform.select({
        ios: `maps://?saddr=${fromLat},${fromLng}&daddr=${toLat},${toLng}&dirflg=d`,
        android: `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`,
        default: `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`,
    });
    Linking.openURL(url);
};

export const openRouteInGoogleMaps = (start, end) => {
    if (!start?.lat || !end?.lat) return;
    openDirections(start.lat, start.lng, end.lat, end.lng);
};

export const openRestStopInGoogleMaps = (stop) => {
    if (!stop?.lat) return;
    openGoogleMaps(stop.lat, stop.lng, stop.label);
};
