import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { User, Globe, LogOut, ChevronRight, ShieldCheck, Database, Map, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Card } from '../components/Card';
import { t, setLanguage, getCurrentLang } from '../utils/i18n';
import { useAuth } from '../utils/authContext';
import { auth as authApi } from '../utils/api';
import { listSavedRoutes, deleteSavedRoute, clearAllRoutes, clearOfflineData } from '../utils/storage';
import { formatBytes } from '../utils/format';
import { ScreenLayout } from '../components/ScreenLayout';

export const Profile = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [lang, setLang] = useState(getCurrentLang());
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);

    const refreshRoutes = async () => {
        setLoadingRoutes(true);
        const routes = await listSavedRoutes();
        setSavedRoutes(routes);
        setLoadingRoutes(false);
    };

    useEffect(() => {
        refreshRoutes();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigation.replace('Login');
    };

    const changeLang = async (newLang) => {
        await setLanguage(newLang);
        setLang(newLang);
        Alert.alert('Language Updated', 'App language has been changed.');
    };

    const handleDeleteRoute = async (id) => {
        const updated = await deleteSavedRoute(id);
        setSavedRoutes(updated);
    };

    const handleClearAll = async () => {
        await clearAllRoutes();
        await clearOfflineData();
        setSavedRoutes([]);
    };

    const totalMechanics = savedRoutes.reduce((sum, r) => sum + (r.count || 0), 0);
    const totalBytes = savedRoutes.reduce((sum, r) => sum + JSON.stringify(r).length, 0);

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
                    <View style={styles.offlineHeader}>
                        <Database size={22} color={COLORS.brand} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.settingLabel}>Offline Routes</Text>
                            <Text style={styles.offlineSub}>
                                {loadingRoutes
                                    ? 'Loading saved routes...'
                                    : savedRoutes.length
                                        ? `${savedRoutes.length} route${savedRoutes.length > 1 ? 's' : ''} · ${totalMechanics} mechanics · ${formatBytes(totalBytes)}`
                                        : 'No routes saved'}
                            </Text>
                        </View>
                    </View>

                    {!loadingRoutes && savedRoutes.length > 0 && (
                        <View style={styles.routesList}>
                            {savedRoutes.map((route) => (
                                <View key={route.id} style={styles.routeItem}>
                                    <TouchableOpacity
                                        style={styles.routeMain}
                                        onPress={() => navigation.navigate('Route', { routeId: route.id })}
                                    >
                                        <Map size={18} color={COLORS.brand} />
                                        <View style={styles.routeInfo}>
                                            <Text style={styles.routeLabel} numberOfLines={1}>{route.label}</Text>
                                            <Text style={styles.routeMeta}>
                                                {route.count} mechanics
                                                {route.route?.distanceKm != null && ` · ${route.route.distanceKm} km`}
                                                {route.savedAt && ` · ${new Date(route.savedAt).toLocaleDateString()}`}
                                            </Text>
                                        </View>
                                        <ChevronRight size={18} color="#444" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.routeDelete}
                                        onPress={() => handleDeleteRoute(route.id)}
                                    >
                                        <Trash2 size={16} color={COLORS.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {savedRoutes.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>Clear all offline data</Text>
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
                            Alert.alert('Disable 2FA', 'Are you sure you want to disable Two-Factor Authentication?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Disable', style: 'destructive', onPress: () => authApi.toggle2FA({ enable: false }).then(() => Alert.alert('Success', '2FA disabled')) },
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
    offlineCard: { padding: SPACING.xl, marginBottom: SPACING.lg },
    offlineHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    offlineSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    routesList: { marginTop: SPACING.lg, gap: 8 },
    routeItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.inputBg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    routeMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: SPACING.md,
    },
    routeInfo: { flex: 1, minWidth: 0 },
    routeLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
    routeMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    routeDelete: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.06)',
    },
    clearBtn: { marginTop: SPACING.md },
    clearBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
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
