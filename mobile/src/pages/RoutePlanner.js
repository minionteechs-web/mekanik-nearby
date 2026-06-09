import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Map, Navigation, Download, CheckCircle, Clock, Ruler, ExternalLink } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { RouteMap } from '../components/RouteMap';
import { RouteDirections } from '../components/RouteDirections';
import { RouteInsights } from '../components/RouteInsights';
import { downloadRouteMechanics } from '../utils/routePlanner';
import { planRoute } from '../utils/routeGeometry';
import { refreshUserLocation, getLocationErrorMessage } from '../utils/location';
import { getSavedRoute, listSavedRoutes } from '../utils/storage';
import { openRouteInGoogleMaps } from '../utils/maps';
import { formatBytes } from '../utils/format';

export const RoutePlanner = ({ navigation, route: navRoute }) => {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState(null);
    const [locationError, setLocationError] = useState('');

    const loadGpsLocation = () => {
        refreshUserLocation()
            .then((loc) => {
                setUserLocation(loc);
                setStart(loc.label.split(',')[0].trim());
                setLocationError('');
            })
            .catch((err) => setLocationError(getLocationErrorMessage(err)));
    };

    useEffect(() => {
        loadGpsLocation();

        const loadSaved = async () => {
            const routeId = navRoute?.params?.routeId;
            if (routeId) {
                const saved = await getSavedRoute(routeId);
                if (saved) {
                    setResult(saved);
                    setStart(saved.route.start?.name || '');
                    setEnd(saved.route.end?.name || '');
                    return;
                }
            }
            const routes = await listSavedRoutes();
            if (routes[0]) setResult(routes[0]);
        };
        loadSaved();
    }, [navRoute?.params?.routeId]);

    const handlePreview = async () => {
        if (!start.trim() || !end.trim()) {
            return Alert.alert('Error', 'Enter both start and destination');
        }
        setPreviewing(true);
        setResult(null);
        try {
            const planned = await planRoute(start.trim(), end.trim());
            setPreview(planned);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not plan route');
            setPreview(null);
        } finally {
            setPreviewing(false);
        }
    };

    const handleDownload = async () => {
        if (!start.trim() || !end.trim()) {
            return Alert.alert('Error', 'Enter both start and destination');
        }
        setDownloading(true);
        try {
            const payload = await downloadRouteMechanics(start.trim(), end.trim());
            setResult(payload);
            setPreview(payload.route);
            Alert.alert('Success', `Saved ${payload.count} mechanics for offline use.`);
        } catch (error) {
            Alert.alert('Error', error.message || 'Download failed. Check your connection.');
        } finally {
            setDownloading(false);
        }
    };

    const activeRoute = result?.route || preview;
    const mapMechanics = result?.mechanics || [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={28} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Route Planner</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {(userLocation || locationError) && (
                    <View style={[styles.locationBanner, locationError && styles.locationBannerError]}>
                        <Navigation size={14} color={locationError ? COLORS.danger : COLORS.brand} />
                        <Text style={[styles.locationText, locationError && styles.locationErrorText]}>
                            {userLocation ? (
                                <>
                                    Your location:{' '}
                                    <Text style={styles.locationStrong}>{userLocation.label}</Text>
                                </>
                            ) : (
                                locationError
                            )}
                        </Text>
                        {locationError && (
                            <TouchableOpacity onPress={loadGpsLocation}>
                                <Text style={styles.retryLink}>Retry</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <Card style={styles.inputCard}>
                    <Text style={styles.sectionTitle}>Plan Your Trip</Text>
                    <Input
                        label="Starting Point"
                        placeholder="e.g. Lagos"
                        value={start}
                        onChangeText={setStart}
                    />
                    <Input
                        label="Destination"
                        placeholder="e.g. Enugu"
                        value={end}
                        onChangeText={setEnd}
                    />
                    <View style={styles.actionRow}>
                        <Button
                            variant="secondary"
                            style={styles.actionBtn}
                            disabled={previewing || !start.trim() || !end.trim()}
                            onPress={handlePreview}
                        >
                            {previewing ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Map size={18} color="white" style={{ marginRight: 8 }} />
                                    Preview Route
                                </>
                            )}
                        </Button>
                        <Button
                            style={styles.actionBtn}
                            disabled={downloading || !start.trim() || !end.trim()}
                            onPress={handleDownload}
                        >
                            <Download size={18} color="white" style={{ marginRight: 8 }} />
                            {downloading ? 'Saving...' : 'Save Offline'}
                        </Button>
                    </View>
                </Card>

                {activeRoute?.path && (
                    <Card style={styles.routeCard}>
                        <View style={styles.routeHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.routeTitle}>
                                    {activeRoute.start?.label || activeRoute.start?.name} → {activeRoute.end?.label || activeRoute.end?.name}
                                </Text>
                                {result && (
                                    <View style={styles.savedBadge}>
                                        <Text style={styles.savedBadgeText}>Saved offline</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.stats}>
                            {activeRoute.distanceKm != null && (
                                <View style={styles.stat}>
                                    <Ruler size={14} color={COLORS.textMuted} />
                                    <Text style={styles.statText}>{activeRoute.distanceKm} km</Text>
                                </View>
                            )}
                            {activeRoute.durationMin != null && (
                                <View style={styles.stat}>
                                    <Clock size={14} color={COLORS.textMuted} />
                                    <Text style={styles.statText}>~{activeRoute.durationMin} min</Text>
                                </View>
                            )}
                        </View>

                        <RouteMap
                            path={activeRoute.path}
                            start={activeRoute.start}
                            end={activeRoute.end}
                            mechanics={mapMechanics}
                            height={260}
                        />

                        <TouchableOpacity
                            style={styles.googleBtn}
                            onPress={() => openRouteInGoogleMaps(activeRoute.start, activeRoute.end)}
                        >
                            <ExternalLink size={16} color="#60A5FA" />
                            <Text style={styles.googleBtnText}>Open in Google Maps</Text>
                        </TouchableOpacity>

                        <RouteDirections steps={activeRoute.steps} collapsedDefault={!!result} />
                        <RouteInsights elevation={activeRoute.elevation} restStops={activeRoute.restStops} />

                        {result ? (
                            <View style={styles.successBox}>
                                <CheckCircle size={20} color={COLORS.success} />
                                <Text style={styles.successText}>
                                    {result.count} mechanics saved ({formatBytes(JSON.stringify(result).length)})
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.previewHint}>
                                Previewing driving route. Tap Save Offline to cache mechanics along this path.
                            </Text>
                        )}
                    </Card>
                )}

                <View style={styles.tipBox}>
                    <Text style={styles.tipTitle}>Pro Tip</Text>
                    <Text style={styles.tipText}>
                        Download route data before leaving major cities. Nigerian highways often have inconsistent network coverage.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textMain, marginLeft: SPACING.md },
    scroll: { padding: SPACING.xl, paddingTop: 0, paddingBottom: 40 },
    locationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    locationBannerError: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    locationText: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
    locationErrorText: { color: COLORS.danger },
    locationStrong: { color: COLORS.textMain, fontWeight: '600' },
    retryLink: { fontSize: 12, fontWeight: '700', color: COLORS.brand },
    inputCard: { marginBottom: SPACING.xl },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: SPACING.lg },
    actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    actionBtn: { flex: 1 },
    routeCard: { marginBottom: SPACING.xl },
    routeHeader: { flexDirection: 'row', marginBottom: SPACING.sm },
    routeTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
    savedBadge: {
        alignSelf: 'flex-start',
        marginTop: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
    },
    savedBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.success },
    stats: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.md },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 13, color: COLORS.textMuted },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: SPACING.md,
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(66, 133, 244, 0.4)',
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
    },
    googleBtnText: { fontSize: 14, fontWeight: '600', color: '#60A5FA' },
    successBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    successText: { color: COLORS.success, fontWeight: '600', fontSize: 14 },
    previewHint: {
        marginTop: SPACING.lg,
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 20,
    },
    tipBox: { marginTop: SPACING.xxl, padding: SPACING.xl, backgroundColor: '#1A1A1A', borderRadius: RADIUS.lg },
    tipTitle: { fontSize: 16, fontWeight: '700', color: COLORS.brand, marginBottom: 8 },
    tipText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
});
