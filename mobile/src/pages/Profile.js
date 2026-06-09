import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { ChevronLeft, User, Globe, LogOut, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Card } from '../components/Card';
import { t, setLanguage, getCurrentLang } from '../utils/i18n';
import { useAuth } from '../utils/authContext';
import { auth as authApi } from '../utils/api';
import { getOfflineMeta, clearOfflineData } from '../utils/storage';
import { formatBytes } from '../utils/format';
import { Database } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';

export const Profile = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [lang, setLang] = useState(getCurrentLang());
    const [offlineMeta, setOfflineMeta] = useState(null);

    useEffect(() => {
        getOfflineMeta().then(setOfflineMeta);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigation.replace('Login');
    };

    const changeLang = async (newLang) => {
        await setLanguage(newLang);
        setLang(newLang);
        Alert.alert("Language Updated", "App language has been changed.");
    };

    return (
        <ScreenLayout navigation={navigation} currentRoute="Profile">
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('profile')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <User size={40} color="white" />
                    </View>
                    <Text style={styles.userName}>{user?.username || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                </View>

                <Text style={styles.sectionTitle}>{t('settings')}</Text>

                <Card style={styles.offlineCard}>
                    <View style={styles.settingLeft}>
                        <Database size={22} color={COLORS.brand} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.settingLabel}>Offline Data</Text>
                            <Text style={styles.offlineSub}>
                                {offlineMeta
                                    ? `${offlineMeta.routeLabel} — ${offlineMeta.count} mechanics (${formatBytes(offlineMeta.sizeBytes)})`
                                    : 'No routes saved'}
                            </Text>
                        </View>
                    </View>
                    {offlineMeta && (
                        <TouchableOpacity onPress={async () => { await clearOfflineData(); setOfflineMeta(null); }}>
                            <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: '700' }}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </Card>

                <Card style={styles.settingsCard}>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Globe size={22} color={COLORS.brand} />
                            <Text style={styles.settingLabel}>{t('language')}</Text>
                        </View>
                        <View style={styles.langSelector}>
                            {['en', 'ha', 'yo', 'ig'].map((l) => (
                                <TouchableOpacity
                                    key={l}
                                    style={[styles.langBtn, lang === l && styles.langBtnActive]}
                                    onPress={() => changeLang(l)}
                                >
                                    <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                                        {l.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.settingItem} 
                        onPress={() => user?.is_2fa_enabled ? 
                            Alert.alert("Disable 2FA", "Are you sure you want to disable Two-Factor Authentication?", [
                                { text: "Cancel", style: "cancel" },
                                { text: "Disable", style: "destructive", onPress: () => authApi.toggle2FA({ enable: false }).then(() => Alert.alert("Success", "2FA disabled")) }
                            ]) : 
                            navigation.navigate('TwoFactorSetup')
                        }
                    >
                        <View style={styles.settingLeft}>
                            <ShieldCheck size={22} color={COLORS.brand} />
                            <Text style={styles.settingLabel}>Security (2FA)</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: user?.is_2fa_enabled ? COLORS.brand : COLORS.textMuted, marginRight: 8, fontWeight: '700' }}>
                                {user?.is_2fa_enabled ? 'ENABLED' : 'OFF'}
                            </Text>
                            <ChevronRight size={20} color="#444" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                        <View style={styles.settingLeft}>
                            <LogOut size={22} color={COLORS.danger} />
                            <Text style={[styles.settingLabel, { color: COLORS.danger }]}>{t('logout')}</Text>
                        </View>
                        <ChevronRight size={20} color="#444" />
                    </TouchableOpacity>
                </Card>

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>Mekanik Nearby v1.0-mobile</Text>
                    <Text style={styles.infoText}>Supporting Nigerian drivers from Lagos to Kano.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textMain, marginLeft: SPACING.md },
    scroll: { padding: SPACING.xl, paddingTop: 0 },
    userCard: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.brand, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    userName: { fontSize: 22, fontWeight: '700', color: COLORS.textMain },
    userEmail: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: 16 },
    offlineCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, marginBottom: SPACING.lg },
    offlineSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    settingsCard: { padding: 0, overflow: 'hidden' },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, borderBottomWidth: 1, borderBottomColor: '#222' },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textMain },
    langSelector: { flexDirection: 'row', gap: 8 },
    langBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#444' },
    langBtnActive: { borderColor: COLORS.brand, backgroundColor: 'rgba(255, 107, 53, 0.1)' },
    langText: { fontSize: 10, color: '#888', fontWeight: '800' },
    langTextActive: { color: COLORS.brand },
    infoBox: { marginTop: 40, alignItems: 'center' },
    infoTitle: { color: '#444', fontSize: 12, fontWeight: '700' },
    infoText: { color: '#333', fontSize: 11, marginTop: 4 },
});
