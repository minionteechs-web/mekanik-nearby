import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
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
import { SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ProfilePhotoPicker } from '../components/ProfilePhotoPicker';
import { t, setLanguage, getCurrentLang } from '../utils/i18n';
import { useAuth } from '../utils/authContext';
import { auth as authApi } from '../utils/api';
import { listSavedRoutes, deleteSavedRoute, clearAllRoutes, clearOfflineData } from '../utils/storage';
import { formatBytes } from '../utils/format';
import { getProfilePrefs, saveProfilePrefs } from '../utils/profilePrefs';
import { mergeUserPreservingAvatar } from '../utils/profileAvatar';
import { ScreenLayout } from '../components/ScreenLayout';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandLogo } from '../components/BrandLogo';
import { useTheme } from '../utils/themeContext';

const vehicleMakeModelValue = (prefs) => {
    const make = prefs.vehicleMake || '';
    const model = prefs.vehicleModel || '';
    return [make, model].filter(Boolean).join(' ');
};

const createStyles = (colors) => ({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.md,
        paddingTop: SPACING.md,
        gap: SPACING.md,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textMain, flex: 1 },
    fieldRow: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
    fieldHalf: { flex: 1, minWidth: 0 },
    scroll: { padding: SPACING.xl, paddingTop: 0, paddingBottom: SPACING.xxl },
    userCard: { alignItems: 'center', marginBottom: SPACING.xl, marginTop: SPACING.md },
    userName: { fontSize: 22, fontWeight: '700', color: colors.textMain, marginTop: SPACING.md },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    userEmail: { fontSize: 14, color: colors.textMuted },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: SPACING.md,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.border,
    },
    roleText: { fontSize: 11, fontWeight: '800', color: colors.textMain, textTransform: 'uppercase' },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    formCard: { padding: SPACING.xl, marginBottom: SPACING.md },
    offlineCard: { padding: SPACING.xl, marginBottom: SPACING.lg },
    offlineHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    offlineSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    routesList: { marginTop: SPACING.lg, gap: 8 },
    routeItem: {
        flexDirection: 'row',
        backgroundColor: colors.inputBg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: colors.border,
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
    routeLabel: { fontSize: 14, fontWeight: '600', color: colors.textMain },
    routeMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    routeDelete: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
    },
    clearBtn: { marginTop: SPACING.md },
    clearBtnText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
    settingsCard: { padding: 0, overflow: 'hidden', marginBottom: SPACING.md },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    settingLabel: { fontSize: 16, fontWeight: '600', color: colors.textMain },
    langSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
    langBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    langBtnActive: { borderColor: colors.brand, backgroundColor: `${colors.brand}1A` },
    langText: { fontSize: 10, color: colors.textMuted, fontWeight: '800' },
    langTextActive: { color: colors.brand },
    passwordBox: { padding: SPACING.xl, paddingTop: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
    helpCard: {
        flexDirection: 'row',
        gap: 12,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        alignItems: 'flex-start',
    },
    helpTitle: { fontSize: 15, fontWeight: '700', color: colors.textMain },
    helpText: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
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
    logoutText: { fontSize: 16, fontWeight: '700', color: colors.danger },
    infoBox: { marginTop: 40, alignItems: 'center', gap: 8 },
    infoTitle: { color: colors.textSubtle, fontSize: 12, fontWeight: '700' },
    infoText: { color: colors.textSubtle, fontSize: 11, marginTop: 4, textAlign: 'center' },
});

export const Profile = ({ navigation }) => {
    const { user, logout, updateUser } = useAuth();
    const { colors } = useTheme();
    const styles = useThemedStyles(createStyles);
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
                const merged = mergeUserPreservingAvatar(user, res.data.user);
                await updateUser(merged);
                setUsername(merged.username || '');
                setPhone(merged.phone || '');
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
            await updateUser(mergeUserPreservingAvatar(user, res.data.user));
            Alert.alert('Saved', 'Account updated.');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not update account');
        } finally {
            setSavingAccount(false);
        }
    };

    const handleSavePrefs = async (updates, notify = false) => {
        const next = await saveProfilePrefs({ ...prefs, ...updates });
        setPrefs(next);
        if (notify) Alert.alert('Saved', 'Preferences saved.');
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
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bgDark }]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile & Settings</Text>
                    <ThemeToggle compact />
                </View>

                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.userCard}>
                        <ProfilePhotoPicker
                            name={displayName}
                            avatarUrl={user?.avatar_url}
                            onUpdated={async (next) => { await updateUser(next); }}
                            size={88}
                        />
                        <Text style={styles.userName}>{displayName}</Text>
                        <View style={styles.metaRow}>
                            <Mail size={13} color={colors.textMuted} />
                            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                        </View>
                        {user?.phone ? (
                            <View style={styles.metaRow}>
                                <Phone size={13} color={colors.textMuted} />
                                <Text style={styles.userEmail}>{user.phone}</Text>
                            </View>
                        ) : null}
                        <View style={styles.roleBadge}>
                            <Shield size={11} color={colors.brand} />
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
                        <Input
                            label="Email"
                            value={user?.email || ''}
                            readOnly
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
                            label="Vehicle make & model"
                            value={vehicleMakeModelValue(prefs)}
                            onChangeText={(v) => {
                                const [make, ...rest] = v.trim().split(/\s+/);
                                setPrefs({
                                    ...prefs,
                                    vehicleMake: make || '',
                                    vehicleModel: rest.join(' '),
                                });
                            }}
                            placeholder="Toyota Corolla"
                        />
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldHalf}>
                                <Input
                                    label="Plate number"
                                    value={prefs.vehiclePlate || ''}
                                    onChangeText={(v) => setPrefs({ ...prefs, vehiclePlate: v })}
                                    placeholder="ABC-123XY"
                                    style={{ marginBottom: 0 }}
                                />
                            </View>
                            <View style={styles.fieldHalf}>
                                <Input
                                    label="Color"
                                    value={prefs.vehicleColor || ''}
                                    onChangeText={(v) => setPrefs({ ...prefs, vehicleColor: v })}
                                    placeholder="Silver"
                                    style={{ marginBottom: 0 }}
                                />
                            </View>
                        </View>
                        <Button variant="secondary" onPress={() => handleSavePrefs(prefs, true)}>
                            Save breakdown details
                        </Button>
                    </Card>

                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <Card style={styles.settingsCard}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Bell size={22} color={colors.brand} />
                                <Text style={styles.settingLabel}>SOS & help alerts</Text>
                            </View>
                            <Switch
                                value={prefs.sosAlerts !== false}
                                onValueChange={(v) => handleSavePrefs({ sosAlerts: v })}
                                trackColor={{ true: colors.brand, false: colors.border }}
                            />
                        </View>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Bell size={22} color={colors.brand} />
                                <Text style={styles.settingLabel}>Mechanic status updates</Text>
                            </View>
                            <Switch
                                value={prefs.mechanicUpdates !== false}
                                onValueChange={(v) => handleSavePrefs({ mechanicUpdates: v })}
                                trackColor={{ true: colors.brand, false: colors.border }}
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
                                <Lock size={22} color={colors.brand} />
                                <Text style={styles.settingLabel}>Change password</Text>
                            </View>
                            <ChevronRight size={20} color={colors.textMuted} />
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
                            onPress={() => navigation.navigate('TwoFactorSetup')}
                        >
                            <View style={styles.settingLeft}>
                                <ShieldCheck size={22} color={colors.brand} />
                                <Text style={styles.settingLabel}>Security (2FA)</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: user?.is_2fa_enabled ? colors.brand : colors.textMuted, marginRight: 8, fontWeight: '700' }}>
                                    {user?.is_2fa_enabled ? 'ON' : 'OFF'}
                                </Text>
                                <ChevronRight size={20} color={colors.textMuted} />
                            </View>
                        </TouchableOpacity>
                    </Card>

                    <Text style={styles.sectionTitle}>{t('settings')}</Text>
                    <Card style={styles.settingsCard}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Globe size={22} color={colors.brand} />
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
                            <Database size={22} color={colors.brand} />
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
                                            <Map size={18} color={colors.brand} />
                                            <View style={styles.routeInfo}>
                                                <Text style={styles.routeLabel} numberOfLines={1}>{route.label}</Text>
                                                <Text style={styles.routeMeta}>
                                                    {route.count} mechanics
                                                    {route.route?.distanceKm != null && ` · ${route.route.distanceKm} km`}
                                                    {route.savedAt && ` · ${new Date(route.savedAt).toLocaleDateString()}`}
                                                </Text>
                                            </View>
                                            <ChevronRight size={18} color={colors.textMuted} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.routeDelete}
                                            onPress={() => handleDeleteRoute(route.id)}
                                        >
                                            <Trash2 size={16} color={colors.danger} />
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
                        <HelpCircle size={22} color={colors.brand} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.helpTitle}>Breakdown safety</Text>
                            <Text style={styles.helpText}>
                                Pull over safely, hazards on, share location, and use cached mechanics if you have no signal.
                            </Text>
                        </View>
                    </Card>

                    <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
                        <LogOut size={22} color={colors.danger} />
                        <Text style={styles.logoutText}>{t('logout')}</Text>
                    </TouchableOpacity>

                    <View style={styles.infoBox}>
                        <BrandLogo size={44} showWordmark={false} />
                        <Text style={styles.infoTitle}>Mekanik Nearby v1.0-mobile</Text>
                        <Text style={styles.infoText}>Supporting Nigerian drivers from Lagos to Kano.</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ScreenLayout>
    );
};
