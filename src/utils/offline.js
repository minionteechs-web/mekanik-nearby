import { openDB } from 'idb';

const DB_NAME = 'MekanikNearbyDB';
const STORE_NAME = 'offline_data';

// Initialize DB
async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
}

export async function saveOfflineData(dataKey, data) {
    const db = await getDB();
    await db.put(STORE_NAME, data, dataKey);
    // Also save a flag in localStorage for quick synchronous checking
    if (dataKey === 'mechanics_route') {
        localStorage.setItem('mekanik_offline_ready', 'true');
    }
}

export async function loadOfflineData(dataKey) {
    const db = await getDB();
    return db.get(STORE_NAME, dataKey);
}

export function isOfflineDataAvailable() {
    return localStorage.getItem('mekanik_offline_ready') === 'true';
}

export async function clearOfflineData() {
    const db = await getDB();
    await db.clear(STORE_NAME);
    localStorage.removeItem('mekanik_offline_ready');
    localStorage.removeItem('mekanik_offline_meta');
}

export function getOfflineMeta() {
    const meta = localStorage.getItem('mekanik_offline_meta');
    return meta ? JSON.parse(meta) : null;
}
