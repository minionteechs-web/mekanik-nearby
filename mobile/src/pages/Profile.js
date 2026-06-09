import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Alert,
    Switch,
} from 'react-native';
import {
    Globe,
    LogOut,
    ChevronRight,
    ShieldCheck,
    Database,
    Map,
    Trash2,
    Phone,
    Car,
    Bell,
    Lock,
    HelpCircle,
    Mail,
    Shield,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { t, setLanguage, getCurrentLang } from '../utils/i18n';
import { useAuth } from '../utils/authContext';
import { auth as authApi } from '../utils/api';
import { listSavedRoutes, deleteSavedRoute, clearAllRoutes, clearOfflineData } from '../utils/storage';
import { formatBytes } from '../utils/format';
import { getProfilePrefs, saveProfilePrefs } from '../utils/profilePrefs';
import { ScreenLayout } from '../components/ScreenLayout';

export const Profile = ({ navigation }) => {
    const { user, logout, updateUser } = useAuth();
    const [lang, setLang] = useState(getCurrentLang());
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [prefs, setPrefs] = useState({});
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [savingAccount, setSavingAccount] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const refreshRoutes = async () => {
        setLoadingRoutes(true);
        const routes = await listSavedRoutes();
        setSavedRoutes(routes);
        setLoadingRoutes(false);
    };

    useEffect(() => {
        (async () => {
            setPrefs(await getProfilePrefs());
            setUsername(user?.username || '');
            setPhone(user?.phone || '');
            refreshRoutes();
            try {
                const res = await authApi.getMe();
                await updateUser(res.data.user);
                setUsername(res.data.user.username || '');
                setPhone(res.data.user.phone || '');
            } catch {
                // offline or session issue — keep cached user
            }
        })();
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

    const handleSaveAccount = async () => {
        setSavingAccount(true);
        try {
            const res = await authApi.updateMe({ username: username.trim(), phone: phone.trim() });
            await updateUser(res.data.user);
            Alert.alert('Saved', 'Account updated.');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not update account');
        } finally {
            setSavingAccount(false);
        }
    };

    const handleSavePrefs = async (updates) => {
        const next = await saveProfilePrefs({ ...prefs, ...updates });
        setPrefs(next);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || newPassword.length < 6) {
            Alert.alert('Error', 'Enter current password and a new password (min 6 chars).');
            return;
        }
        try {
            await authApi.changePassword({ currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            setShowPasswordForm(false);
            Alert.alert('Success', 'Password updated.');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not change password');
        }
    };

    const totalMechanics = savedRoutes.reduce((sum, r) => sum + (r.count || 0), 0);
    const totalBytes = savedRoutes.reduce((sum, r) => sum + JSON.stringify(r).length, 0);
    const displayName = user?.username || 'User';

    return (
        <ScreenLayout navigation={navigation} currentRoute="Profile">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('profile')}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.userCard}>
                        <ProfileAvatar name={displayName} size={88} />
                        <Text style={styles.userName}>{displayName}</Text>
                        <View style={styles.metaRow}>
                            <Mail size={13} color={COLORS.textMuted} />
                            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                        </View>
                        {user?.phone ? (
                            <View style={styles.metaRow}>
                                <Phone size={13} color={COLORS.textMuted} />
                                <Text style={styles.userEmail}>{user.phone}</Text>
                            </View>
                        ) : null}
                        <View style={styles.roleBadge}>
                            <Shield size={11} color={COLORS.brand} />
                            <Text style={styles.roleText}>{user?.role || 'driver'}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Account</Text>
                    <Card style={styles.formCard}>
                        <Input label="Display name" value={username} onChangeText={setUsername} />
                        <Input
                            label="Phone (shown to mechanics on SOS)"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="+234 800 000 0000"
                        />
                        <Button onPress={handleSaveAccount} disabled={savingAccount}>
                            {savingAccount ? 'Saving...' : 'Save account'}
                        </Button>
                    </Card>

                    <Text style={styles.sectionTitle}>Emergency & vehicle</Text>
                    <Card style={styles.formCard}>
                        <Input
                            label="Emergency contact name"
                            value={prefs.emergencyName || ''}
                            onChangeText={(v) => setPrefs({ ...prefs, emergencyName: v })}
                        />
                        <Input
                            label="Emergency phone"
                            value={prefs.emergencyContact || ''}
                            onChangeText={(v) => setPrefs({ ...prefs, emergencyContact: v })}
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="Vehicle make"
                            value={prefs.vehicleMake || ''}
                            onChangeText={(v) => setPrefs({ ...prefs, vehicleMake: v })}
                            placeholder="Toyota"
                        />
                        <Input
                            label="Vehicle model"
                            value={prefs.vehicleModel || ''}
                            onChangeText={(v) => setPrefs({ ...prefs, vehicleModel: v })}
                            placeholder="Corolla"
                        />
                        <Input
                            label="Plate number"
                            value={prefs.vehiclePlate || ''}
                            onChangeText={(v) => setPrefs({ ...prefs, vehiclePlate: v })}
                        />
                        <Input
                            label="Vehicle color"
                            value={prefs.vehicleColor || ''}
                            onChangeText={(v) => setPrefs({ ...prefs, vehicleColor: v })}
                        />
                        <Button variant="secondary" onPress={() => handleSavePrefs(prefs)}>
                            Save breakdown details
                        </Button>
                    </Card>

                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <Card style={styles.settingsCard}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Bell size={22} color={COLORS.brand} />
                                <Text style={styles.settingLabel}>SOS & help alerts</Text>
                            </View>
                            <Switch
                                value={prefs.sosAlerts !== false}
                                onValueChange={(v) => handleSavePrefs({ sosAlerts: v })}
                                trackColor={{ true: COLORS.brand, false: '#444' }}
                            />
                        </View>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Bell size={22} color={COLORS.brand} />
                                <Text style={styles.settingLabel}>Mechanic status updates</Text>
                            </View>
                            <Switch
                                value={prefs.mechanicUpdates !== false}
                                onValueChange={(v) => handleSavePrefs({ mechanicUpdates: v })}
                                trackColor={{ true: COLORS.brand, false: '#444' }}
                            />
                        </View>
                    </Card>

                    <Text style={styles.sectionTitle}>Security</Text>
                    <Card style={styles.settingsCard}>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => setShowPasswordForm(!showPasswordForm)}
                        >
                            <View style={styles.settingLeft}>
                                <Lock size={22} color={COLORS.brand} />
                                <Text style={styles.settingLabel}>Change password</Text>
                            </View>
                            <ChevronRight size={20} color="#444" />
                        </TouchableOpacity>
                        {showPasswordForm && (
                            <View style={styles.passwordBox}>
                                <Input
                                    label="Current password"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry
                                />
                                <Input
                                    label="New password"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />
                                <Button onPress={handleChangePassword}>Update password</Button>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() =>
                                user?.is_2fa_enabled
                                    ? Alert.alert('Disable 2FA', 'Are you sure?', [
                                          { text: 'Cancel', style: 'cancel' },
                                          {
                                              text: 'Disable',
                                              style: 'destructive',
                                              onPress: async () => {
                                                  await authApi.toggle2FA({ enable: false });
                                                  await updateUser({ is_2fa_enabled: false });
                                                  Alert.alert('Success', '2FA disabled');
                                              },
                                          },
                                      ])
                                    : navigation.navigate('TwoFactorSetup')
                            }
                        >
                            <View style={styles.settingLeft}>
                                <ShieldCheck size={22} color={COLORS.brand} />
                                <Text style={styles.settingLabel}>Security (2FA)</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: user?.is_2fa_enabled ? COLORS.brand : COLORS.textMuted, marginRight: 8, fontWeight: '700' }}>
                                    {user?.is_2fa_enabled ? 'ON' : 'OFF'}
                                </Text>
                                <ChevronRight size={20} color="#444" />
                            </View>
                        </TouchableOpacity>
                    </Card>

                    <Text style={styles.sectionTitle}>{t('settings')}</Text>
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
                    </Card>

                    <Text style={styles.sectionTitle}>Offline routes</Text>
                    <Card style={styles.offlineCard}>
                        <View style={styles.offlineHeader}>
                            <Database size={22} color={COLORS.brand} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Saved routes</Text>
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

                    <Card style={styles.helpCard}>
                        <HelpCircle size={22} color={COLORS.brand} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.helpTitle}>Breakdown safety</Text>
                            <Text style={styles.helpText}>
                                Pull over safely, hazards on, share location, and use cached mechanics if you have no signal.
                            </Text>
                        </View>
                    </Card>

                    <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
                        <LogOut size={22} color={COLORS.danger} />
                        <Text style={styles.logoutText}>{t('logout')}</Text>
                    </TouchableOpacity>

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
    scroll: { padding: SPACING.xl, paddingTop: 0, paddingBottom: SPACING.xxl },
    userCard: { alignItems: 'center', marginBottom: SPACING.xl, marginTop: SPACING.md },
    userName: { fontSize: 22, fontWeight: '700', color: COLORS.textMain, marginTop: SPACING.md },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    userEmail: { fontSize: 14, color: COLORS.textMuted },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: SPACING.md,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    roleText: { fontSize: 11, fontWeight: '800', color: COLORS.textMain, textTransform: 'uppercase' },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    formCard: { padding: SPACING.xl, marginBottom: SPACING.md },
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
    settingsCard: { padding: 0, overflow: 'hidden', marginBottom: SPACING.md },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    settingLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textMain },
    langSelector: { flexDirection: 'row', gap: 8 },
    langBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#444' },
    langBtnActive: { borderColor: COLORS.brand, backgroundColor: 'rgba(255, 107, 53, 0.1)' },
    langText: { fontSize: 10, color: '#888', fontWeight: '800' },
    langTextActive: { color: COLORS.brand },
    passwordBox: { padding: SPACING.xl, paddingTop: 0, borderBottomWidth: 1, borderBottomColor: '#222' },
    helpCard: {
        flexDirection: 'row',
        gap: 12,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        alignItems: 'flex-start',
    },
    helpTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
    helpText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
    logoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: SPACING.xl,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
    },
    logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.danger },
    infoBox: { marginTop: 40, alignItems: 'center' },
    infoTitle: { color: '#444', fontSize: 12, fontWeight: '700' },
    infoText: { color: '#333', fontSize: 11, marginTop: 4 },
});
