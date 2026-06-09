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

export const openDirections = (toLat, toLng) => {
    const url = Platform.select({
        ios: `maps:daddr=${toLat},${toLng}`,
        android: `google.navigation:q=${toLat},${toLng}`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${toLat},${toLng}&travelmode=driving`,
    });
    Linking.openURL(url);
};
