import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'cached_mechanics';
const ROUTE_KEY = 'mechanics_route';
const META_KEY = 'mekanik_offline_meta';

export const initDB = async () => {};

export const saveMechanicsOffline = async (mechanics) => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mechanics));
};

export const getCachedMechanics = async () => {
    const data = await AsyncStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveRouteOffline = async (payload) => {
    const json = JSON.stringify(payload);
    await AsyncStorage.setItem(ROUTE_KEY, json);
    await AsyncStorage.setItem(META_KEY, JSON.stringify({
        routeLabel: `${payload.route.start.label || payload.route.start.name} → ${payload.route.end.label || payload.route.end.name}`,
        count: payload.count,
        downloadedAt: payload.route.downloadedAt,
        sizeBytes: json.length,
    }));
};

export const getRouteOffline = async () => {
    const data = await AsyncStorage.getItem(ROUTE_KEY);
    return data ? JSON.parse(data) : null;
};

export const getOfflineMeta = async () => {
    const data = await AsyncStorage.getItem(META_KEY);
    return data ? JSON.parse(data) : null;
};

export const clearOfflineData = async () => {
    await AsyncStorage.multiRemove([CACHE_KEY, ROUTE_KEY, META_KEY]);
};
