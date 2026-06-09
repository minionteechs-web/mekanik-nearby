import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function getProfilePrefs() {
    try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        return raw ? { ...defaultProfilePrefs, ...JSON.parse(raw) } : { ...defaultProfilePrefs };
    } catch {
        return { ...defaultProfilePrefs };
    }
}

export async function saveProfilePrefs(prefs) {
    const merged = { ...defaultProfilePrefs, ...prefs };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    return merged;
}

export async function updateStoredUser(partial) {
    const raw = await AsyncStorage.getItem('user');
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const next = { ...stored, ...partial };
    await AsyncStorage.setItem('user', JSON.stringify(next));
    return next;
}
