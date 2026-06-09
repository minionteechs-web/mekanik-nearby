const PREFS_KEY = 'mekanik_profile_prefs';

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

export function updateStoredUser(partial) {
    const raw = localStorage.getItem('mekanik_user');
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const next = { ...stored, ...partial };
    localStorage.setItem('mekanik_user', JSON.stringify(next));
    return next;
}
