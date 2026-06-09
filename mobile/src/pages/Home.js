import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import { ShieldAlert, Compass, Wrench, ChevronUp, MapPin, Navigation } from 'lucide-react-native';
import { SPACING, RADIUS } from '../constants/theme';
import { Card } from '../components/Card';
import { LiveMap } from '../components/LiveMap';
import { mechanics, initSocket } from '../utils/api';
import { t } from '../utils/i18n';
import { getGreeting, formatDistance } from '../utils/format';
import { ScreenLayout } from '../components/ScreenLayout';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useTheme } from '../utils/themeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

const logoSource = require('../../assets/logo.png');
import { refreshUserLocation, getLocationErrorMessage } from '../utils/location';
import { openLocationSettings } from '../utils/geo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_REGION } from '../constants/mapStyles';

const createStyles = (colors) => ({
    container: { flex: 1, backgroundColor: colors.bgDark },
    mapLayer: { flex: 1, position: 'relative' },
    map: { flex: 1 },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        backgroundColor: 'transparent',
    },
    brandChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        marginBottom: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: RADIUS.pill,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
    },
    brandPin: { width: 18, height: 18, resizeMode: 'contain' },
    brandName: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    greetingTitle: { fontSize: 22, fontWeight: '800', color: colors.textMain },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    locationLine: { fontSize: 12, color: colors.textMuted, flex: 1 },
    locationError: { color: colors.danger },
    retryLink: { fontSize: 12, fontWeight: '700', color: colors.brand, marginTop: 4 },
    liveUpdate: { fontSize: 12, fontWeight: '700', color: colors.success, marginTop: 4 },
    nearbyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: `${colors.brand}26`,
        borderWidth: 1,
        borderColor: `${colors.brand}4D`,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
    },
    nearbyChipText: { color: colors.brand, fontSize: 11, fontWeight: '700' },
    headerActions: { alignItems: 'flex-end', gap: 8 },
    sheet: {
        backgroundColor: colors.bgCard,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        borderTopWidth: 1,
        borderColor: colors.border,
        maxHeight: '38%',
    },
    sheetExpanded: { maxHeight: '55%' },
    sheetHandle: { alignItems: 'center', paddingVertical: SPACING.md },
    grabber: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 4 },
    chevronUp: { transform: [{ rotate: '180deg' }] },
    sheetContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
    quickRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    quickPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: RADIUS.pill,
        backgroundColor: `${colors.brand}1A`,
        borderWidth: 1,
        borderColor: `${colors.brand}33`,
    },
    quickPillSecondary: { backgroundColor: colors.bgElevated, borderColor: colors.border },
    sosPill: { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' },
    quickPillText: { fontSize: 11, fontWeight: '700', color: colors.brand },
    sheetTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: SPACING.md },
    mechRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.md },
    mechAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center',
    },
    mechInitial: { color: '#fff', fontWeight: '800', fontSize: 16 },
    mechInfo: { flex: 1 },
    mechName: { fontSize: 15, fontWeight: '700', color: colors.textMain },
    mechSpec: { fontSize: 12, color: colors.textMuted },
    mechDist: { fontSize: 12, fontWeight: '600', color: colors.brand },
    empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: SPACING.lg },
});

export const Home = ({ navigation }) => {
    const styles = useThemedStyles(createStyles);
    const { colors } = useTheme();
    const [user, setUser] = useState(null);
    const [nearbyMechanics, setNearbyMechanics] = useState([]);
    const [location, setLocation] = useState(null);
    const [locationLabel, setLocationLabel] = useState('Locating you...');
    const [locationError, setLocationError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sheetExpanded, setSheetExpanded] = useState(false);
    const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
    const [liveUpdate, setLiveUpdate] = useState('');

    useEffect(() => {
        loadUserData();
        setupLocationAndMechanics();

        let socket;
        let onAccepted;
        let onStatus;

        (async () => {
            socket = await initSocket();
            if (!socket) return;

            onAccepted = () => setLiveUpdate('Mechanic accepted your SOS — check Activity');
            onStatus = (data) => {
                if (['en-route', 'arrived', 'completed'].includes(data.status)) {
                    setLiveUpdate(`Help request: ${data.status.replace('-', ' ')}`);
                }
            };

            socket.on('request_accepted', onAccepted);
            socket.on('status_updated', onStatus);
        })();

        return () => {
            if (socket && onAccepted) {
                socket.off('request_accepted', onAccepted);
                socket.off('status_updated', onStatus);
            }
        };
    }, []);

    const loadUserData = async () => {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) setUser(JSON.parse(userJson));
    };

    const setupLocationAndMechanics = async () => {
        setLoading(true);
        setLocationError('');
        try {
            const loc = await refreshUserLocation();
            setLocation({ latitude: loc.lat, longitude: loc.lng });
            setLocationLabel(loc.label);
            setMapRegion({
                latitude: loc.lat,
                longitude: loc.lng,
                latitudeDelta: 0.045,
                longitudeDelta: 0.045,
            });
            const response = await mechanics.getNearby(loc.lat, loc.lng, 50000);
            setNearbyMechanics(response.data);
        } catch (err) {
            console.error(err);
            const msg = getLocationErrorMessage(err);
            setLocationError(msg);
            setLocationLabel('Location unavailable');
            setNearbyMechanics([]);
            if (err?.code === 'denied' || err?.code === 'disabled') {
                Alert.alert(
                    'Location required',
                    msg,
                    [
                        { text: 'Open Settings', onPress: openLocationSettings },
                        { text: 'Try again', onPress: setupLocationAndMechanics },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const fitCoords = useMemo(() => {
        const pts = [];
        if (location) pts.push(location);
        nearbyMechanics.forEach((m) => {
            if (m.lat != null) pts.push({ latitude: m.lat, longitude: m.lng });
        });
        return pts;
    }, [location, nearbyMechanics]);

    const preview = sheetExpanded ? nearbyMechanics : nearbyMechanics.slice(0, 3);

    return (
        <ScreenLayout navigation={navigation} currentRoute="Home">
            <View style={styles.container}>
                <View style={styles.mapLayer}>
                    <LiveMap
                        region={mapRegion}
                        userLocation={location}
                        mechanics={nearbyMechanics}
                        fitToCoordinates={fitCoords.length > 1 ? fitCoords : undefined}
                        onMechanicPress={(mech) => navigation.navigate('MechanicDetail', { id: mech.id })}
                        style={styles.map}
                    />
                    <SafeAreaView style={styles.mapOverlay}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.brandChip}>
                                <Image source={logoSource} style={styles.brandPin} />
                                <Text style={styles.brandName}>Mekanik Nearby</Text>
                            </View>
                            <Text style={styles.greetingTitle}>{getGreeting(user?.username || 'Driver')}</Text>
                            <View style={styles.locationRow}>
                                <Navigation size={12} color={locationError ? colors.danger : colors.brand} />
                                <Text style={[styles.locationLine, locationError && styles.locationError]}>
                                    {loading ? 'Finding your location...' : locationError || `You're in ${locationLabel}`}
                                </Text>
                            </View>
                            {locationError && (
                                <TouchableOpacity onPress={setupLocationAndMechanics}>
                                    <Text style={styles.retryLink}>Enable location</Text>
                                </TouchableOpacity>
                            )}
                            {liveUpdate ? (
                                <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
                                    <Text style={styles.liveUpdate}>{liveUpdate} →</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <View style={styles.headerActions}>
                            {!loading && !locationError && nearbyMechanics.length > 0 && (
                                <View style={styles.nearbyChip}>
                                    <MapPin size={12} color={colors.brand} />
                                    <Text style={styles.nearbyChipText}>{nearbyMechanics.length} nearby</Text>
                                </View>
                            )}
                            <ProfileAvatar
                                name={user?.username || 'Driver'}
                                size={40}
                                onPress={() => navigation.navigate('Profile')}
                            />
                        </View>
                    </SafeAreaView>
                </View>

                <View style={[styles.sheet, sheetExpanded && styles.sheetExpanded]}>
                    <TouchableOpacity style={styles.sheetHandle} onPress={() => setSheetExpanded(!sheetExpanded)}>
                        <View style={styles.grabber} />
                        <ChevronUp size={18} color={colors.textMuted} style={sheetExpanded && styles.chevronUp} />
                    </TouchableOpacity>

                    <View style={styles.sheetContent}>
                        <View style={styles.quickRow}>
                            <TouchableOpacity style={styles.quickPill} onPress={() => navigation.navigate('Mechanics')}>
                                <Wrench size={14} color={colors.brand} />
                                <Text style={styles.quickPillText}>Browse all</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.quickPill, styles.quickPillSecondary]} onPress={() => navigation.navigate('Route')}>
                                <Compass size={14} color={colors.textMuted} />
                                <Text style={[styles.quickPillText, { color: colors.textMuted }]}>Offline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.quickPill, styles.sosPill]} onPress={() => navigation.navigate('SOS')}>
                                <ShieldAlert size={14} color={colors.danger} />
                                <Text style={[styles.quickPillText, { color: colors.danger }]}>SOS</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sheetTitle}>
                            {loading ? 'Searching...' : locationError ? 'Enable GPS to find nearby mechanics' : `${nearbyMechanics.length} mechanics near you`}
                        </Text>

                        {preview.map((mech) => (
                            <Card
                                key={mech.id}
                                style={styles.mechRow}
                                onPress={() => navigation.navigate('MechanicDetail', { id: mech.id })}
                            >
                                <View style={styles.mechAvatar}>
                                    <Text style={styles.mechInitial}>{mech.name?.charAt(0)}</Text>
                                </View>
                                <View style={styles.mechInfo}>
                                    <Text style={styles.mechName}>{mech.name}</Text>
                                    <Text style={styles.mechSpec}>{mech.specialty}</Text>
                                </View>
                                <Text style={styles.mechDist}>{formatDistance(mech.distance_meters)}</Text>
                            </Card>
                        ))}

                        {!loading && !locationError && nearbyMechanics.length === 0 && (
                            <Text style={styles.empty}>No mechanics online nearby right now.</Text>
                        )}
                    </View>
                </View>
            </View>
        </ScreenLayout>
    );
};
