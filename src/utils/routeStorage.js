import { openDB } from 'idb';

const DB_NAME = 'MekanikNearbyDB';
const STORE_NAME = 'offline_data';
const ROUTES_KEY = 'saved_routes';
const LEGACY_KEY = 'mechanics_route';
const MAX_ROUTES = 10;

async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
}

const migrateLegacy = async () => {
    const db = await getDB();
    const existing = await db.get(STORE_NAME, ROUTES_KEY);
    if (existing?.length) return;

    const legacy = await db.get(STORE_NAME, LEGACY_KEY);
    if (legacy?.route) {
        const entry = {
            id: crypto.randomUUID(),
            savedAt: legacy.route.downloadedAt || new Date().toISOString(),
            label: `${legacy.route.start?.label || legacy.route.start?.name} → ${legacy.route.end?.label || legacy.route.end?.name}`,
            ...legacy,
        };
        await db.put(STORE_NAME, [entry], ROUTES_KEY);
    }
};

export async function listSavedRoutes() {
    await migrateLegacy();
    const db = await getDB();
    return (await db.get(STORE_NAME, ROUTES_KEY)) || [];
}

export async function getSavedRoute(id) {
    const routes = await listSavedRoutes();
    return routes.find((r) => r.id === id) || null;
}

export async function saveRoute(payload) {
    const db = await getDB();
    const routes = await listSavedRoutes();
    const label = `${payload.route.start?.label || payload.route.start?.name} → ${payload.route.end?.label || payload.route.end?.name}`;

    const existingIdx = routes.findIndex(
        (r) => r.route?.start?.name === payload.route.start?.name &&
            r.route?.end?.name === payload.route.end?.name
    );

    const entry = {
        id: existingIdx >= 0 ? routes[existingIdx].id : crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        label,
        ...payload,
    };

    const updated = existingIdx >= 0
        ? [entry, ...routes.filter((_, i) => i !== existingIdx)]
        : [entry, ...routes];

    const trimmed = updated.slice(0, MAX_ROUTES);
    await db.put(STORE_NAME, trimmed, ROUTES_KEY);
    await db.put(STORE_NAME, entry, LEGACY_KEY);

    const meta = {
        routeLabel: label,
        count: payload.count,
        savedAt: entry.savedAt,
        sizeBytes: new Blob([JSON.stringify(entry)]).size,
        totalRoutes: trimmed.length,
    };
    localStorage.setItem('mekanik_offline_meta', JSON.stringify(meta));
    localStorage.setItem('mekanik_offline_ready', 'true');

    return entry;
}

export async function deleteSavedRoute(id) {
    const db = await getDB();
    const routes = (await listSavedRoutes()).filter((r) => r.id !== id);
    await db.put(STORE_NAME, routes, ROUTES_KEY);

    if (routes.length > 0) {
        await db.put(STORE_NAME, routes[0], LEGACY_KEY);
        localStorage.setItem('mekanik_offline_meta', JSON.stringify({
            routeLabel: routes[0].label,
            count: routes[0].count,
            savedAt: routes[0].savedAt,
            sizeBytes: new Blob([JSON.stringify(routes[0])]).size,
            totalRoutes: routes.length,
        }));
    } else {
        await db.delete(STORE_NAME, LEGACY_KEY);
        localStorage.removeItem('mekanik_offline_meta');
        localStorage.removeItem('mekanik_offline_ready');
    }
    return routes;
}

export async function clearAllRoutes() {
    const db = await getDB();
    await db.delete(STORE_NAME, ROUTES_KEY);
    await db.delete(STORE_NAME, LEGACY_KEY);
    localStorage.removeItem('mekanik_offline_meta');
    localStorage.removeItem('mekanik_offline_ready');
}

export async function getAllCachedMechanics() {
    const routes = await listSavedRoutes();
    const map = new Map();
    routes.forEach((r) => {
        (r.mechanics || []).forEach((m) => { if (m?.id) map.set(m.id, m); });
    });
    if (map.size === 0) {
        const db = await getDB();
        const legacy = await db.get(STORE_NAME, LEGACY_KEY);
        (legacy?.mechanics || []).forEach((m) => { if (m?.id) map.set(m.id, m); });
    }
    return Array.from(map.values());
}
