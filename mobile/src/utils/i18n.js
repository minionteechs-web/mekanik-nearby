import { TRANSLATIONS } from '../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentLang = 'en';

export const initI18n = async () => {
    const savedLang = await AsyncStorage.getItem('lang');
    if (savedLang) {
        currentLang = savedLang;
    }
};

export const setLanguage = async (lang) => {
    currentLang = lang;
    await AsyncStorage.setItem('lang', lang);
};

export const t = (key, params = {}) => {
    let text = TRANSLATIONS[currentLang]?.[key] || key;

    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });

    return text;
};

export const getCurrentLang = () => currentLang;
