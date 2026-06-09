import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'cached_mechanics';
const ROUTE_KEY = 'mechanics_route';
const ROUTES_KEY = 'saved_routes';
const META_KEY = 'mekanik_offline_meta';
const MAX_ROUTES = 10;

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const initDB = async () => {};

export const saveMechanicsOffline = async (mechanics) => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mechanics));
};

export const getCachedMechanics = async () => {
    const data = await AsyncStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
};

const migrateLegacy = async () => {
    const existing = await AsyncStorage.getItem(ROUTES_KEY);
    if (existing) return;

    const legacy = await AsyncStorage.getItem(ROUTE_KEY);
    if (!legacy) return;

    const parsed = JSON.parse(legacy);
    if (!parsed?.route) return;

    const entry = {
        id: genId(),
        savedAt: parsed.route.downloadedAt || new Date().toISOString(),
        label: `${parsed.route.start?.label || parsed.route.start?.name} → ${parsed.route.end?.label || parsed.route.end?.name}`,
        ...parsed,
    };
    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify([entry]));
};

export const listSavedRoutes = async () => {
    await migrateLegacy();
    const data = await AsyncStorage.getItem(ROUTES_KEY);
    return data ? JSON.parse(data) : [];
};

export const getSavedRoute = async (id) => {
    const routes = await listSavedRoutes();
    return routes.find((r) => r.id === id) || null;
};

export const saveRouteOffline = async (payload) => {
    const routes = await listSavedRoutes();
    const label = `${payload.route.start?.label || payload.route.start?.name} → ${payload.route.end?.label || payload.route.end?.name}`;
    const json = JSON.stringify(payload);

    const existingIdx = routes.findIndex(
        (r) => r.route?.start?.name === payload.route.start?.name &&
            r.route?.end?.name === payload.route.end?.name
    );

    const entry = {
        id: existingIdx >= 0 ? routes[existingIdx].id : genId(),
        savedAt: new Date().toISOString(),
        label,
        ...payload,
    };

    const updated = existingIdx >= 0
        ? [entry, ...routes.filter((_, i) => i !== existingIdx)]
        : [entry, ...routes];

    const trimmed = updated.slice(0, MAX_ROUTES);
    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(trimmed));
    await AsyncStorage.setItem(ROUTE_KEY, JSON.stringify(entry));
    await AsyncStorage.setItem(META_KEY, JSON.stringify({
        routeLabel: label,
        count: payload.count,
        savedAt: entry.savedAt,
        sizeBytes: json.length,
        totalRoutes: trimmed.length,
    }));

    return entry;
};

export const deleteSavedRoute = async (id) => {
    const routes = (await listSavedRoutes()).filter((r) => r.id !== id);
    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(routes));

    if (routes.length > 0) {
        await AsyncStorage.setItem(ROUTE_KEY, JSON.stringify(routes[0]));
        await AsyncStorage.setItem(META_KEY, JSON.stringify({
            routeLabel: routes[0].label,
            count: routes[0].count,
            savedAt: routes[0].savedAt,
            sizeBytes: JSON.stringify(routes[0]).length,
            totalRoutes: routes.length,
        }));
    } else {
        await AsyncStorage.multiRemove([ROUTE_KEY, META_KEY]);
    }
    return routes;
};

export const clearAllRoutes = async () => {
    await AsyncStorage.multiRemove([ROUTES_KEY, ROUTE_KEY, META_KEY]);
};

export const getRouteOffline = async () => {
    const routes = await listSavedRoutes();
    if (routes[0]) return routes[0];
    const data = await AsyncStorage.getItem(ROUTE_KEY);
    return data ? JSON.parse(data) : null;
};

export const getAllCachedMechanics = async () => {
    const routes = await listSavedRoutes();
    const map = new Map();
    routes.forEach((r) => {
        (r.mechanics || []).forEach((m) => { if (m?.id) map.set(m.id, m); });
    });
    if (map.size === 0) {
        const legacy = await getRouteOffline();
        (legacy?.mechanics || []).forEach((m) => { if (m?.id) map.set(m.id, m); });
    }
    return Array.from(map.values());
};

export const getOfflineMeta = async () => {
    const data = await AsyncStorage.getItem(META_KEY);
    return data ? JSON.parse(data) : null;
};

export const clearOfflineData = async () => {
    await AsyncStorage.multiRemove([CACHE_KEY, ROUTES_KEY, ROUTE_KEY, META_KEY]);
};
