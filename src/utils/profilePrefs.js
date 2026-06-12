const PREFS_KEY = 'mekanik_profile_prefs';
export const USER_UPDATED_EVENT = 'mekanik_user_updated';

export const defaultProfilePrefs = {
    emergencyName: '',
    emergencyContact: '',
    vehicleMake: '',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleColor: '',
    sosAlerts: true,
    mechanicUpdates: true,
};

export function getProfilePrefs() {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        return raw ? { ...defaultProfilePrefs, ...JSON.parse(raw) } : { ...defaultProfilePrefs };
    } catch {
        return { ...defaultProfilePrefs };
    }
}

export function saveProfilePrefs(prefs) {
    const merged = { ...defaultProfilePrefs, ...prefs };
    localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    return merged;
}

export function getStoredUser() {
    try {
        const raw = localStorage.getItem('mekanik_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setStoredUser(user) {
    localStorage.setItem('mekanik_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: user }));
    return user;
}

export function updateStoredUser(partial) {
    const raw = localStorage.getItem('mekanik_user');
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const next = { ...stored, ...partial };
    localStorage.setItem('mekanik_user', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: next }));
    return next;
}

export function subscribeToUserUpdates(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener(USER_UPDATED_EVENT, handler);
    return () => window.removeEventListener(USER_UPDATED_EVENT, handler);
}
