import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ShieldAlert, X, MessageSquare, Share2, Navigation } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LiveMap } from '../components/LiveMap';
import { requests, mechanics, initSocket } from '../utils/api';
import { getCurrentLocation } from '../utils/geo';
import { formatDistance } from '../utils/format';
import { openDirections, openGoogleMaps } from '../utils/maps';
import { t } from '../utils/i18n';

export const SOS = ({ navigation, route }) => {
    const [status, setStatus] = useState('idle');
    const [nearest, setNearest] = useState(null);
    const [activeRequest, setActiveRequest] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [mechanicLocation, setMechanicLocation] = useState(null);
    const [requestStatus, setRequestStatus] = useState('pending');

    useEffect(() => {
        let socket;
        (async () => {
            socket = await initSocket();
            if (socket) {
                socket.on('request_accepted', (data) => {
                    if (data.id === activeRequest?.id) {
                        setRequestStatus('accepted');
                        setStatus('tracking');
                    }
                });
                socket.on('status_updated', (data) => {
                    if (data.id === activeRequest?.id) setRequestStatus(data.status);
                });
                socket.on('mechanic_location', (data) => {
                    if (data.requestId === activeRequest?.id) {
                        setMechanicLocation({
                            latitude: data.lat,
                            longitude: data.lng,
                            title: nearest?.name || 'Mechanic',
                        });
                    }
                });
            }
        })();

        const trackId = route?.params?.trackId;
        if (trackId) {
            setStatus('tracking');
            requests.getUserRequests().then((res) => {
                const req = res.data.find((r) => r.id === trackId);
                if (req) {
                    setActiveRequest(req);
                    setRequestStatus(req.status);
                    if (req.driver_lat) {
                        setUserLocation({ latitude: req.driver_lat, longitude: req.driver_lng });
                    }
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('request_accepted');
                socket.off('status_updated');
                socket.off('mechanic_location');
            }
        };
    }, [activeRequest?.id, nearest?.name, route?.params?.trackId]);

    useEffect(() => {
        const mechanicId = route?.params?.mechanicId;
        if (!mechanicId) return;
        mechanics.getDetail(mechanicId).then((res) => {
            if (res.data) {
                setNearest(res.data);
                setStatus('found');
            }
        }).catch(() => {});
    }, [route?.params?.mechanicId]);

    const handleSOS = async () => {
        setStatus('locating');
        try {
            const coords = await getCurrentLocation();
            if (!coords) throw new Error('Could not get location');

            setUserLocation(coords);
            const nearbyRes = await mechanics.getNearby(coords.latitude, coords.longitude, 50000);
            const nearestMech = nearbyRes.data[0];

            if (!nearestMech) {
                setStatus('idle');
                return Alert.alert('No Mechanics Nearby', 'No available mechanics within 50 km.');
            }

            setNearest(nearestMech);
            setStatus('found');
        } catch (err) {
            console.error(err);
            setStatus('idle');
            Alert.alert('SOS Failed', 'Could not get your location or reach the server.');
        }
    };

    const confirmRequest = async () => {
        if (!nearest) return;
        try {
            const coords = await getCurrentLocation();
            if (!coords) return;
            setUserLocation(coords);

            const requestRes = await requests.create({
                mechanic_id: nearest.user_id,
                lat: coords.latitude,
                lng: coords.longitude,
            });

            setActiveRequest(requestRes.data);
            setRequestStatus('pending');
            setStatus('tracking');
        } catch (err) {
            Alert.alert('Request Failed', 'Could not send help request.');
        }
    };

    const fitCoords = [];
    if (userLocation) fitCoords.push(userLocation);
    if (nearest?.lat) fitCoords.push({ latitude: nearest.lat, longitude: nearest.lng });
    if (mechanicLocation) fitCoords.push(mechanicLocation);

    if (status === 'tracking') {
        return (
            <View style={styles.trackingContainer}>
                <View style={styles.trackingMap}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                        <X size={22} color="#fff" />
                    </TouchableOpacity>
                    <LiveMap
                        userLocation={userLocation}
                        mechanics={nearest ? [nearest] : []}
                        trackingLocation={mechanicLocation}
                        fitToCoordinates={fitCoords.length > 1 ? fitCoords : undefined}
                        style={styles.mapFill}
                    />
                </View>
                <ScrollView style={styles.trackingPanel} contentContainerStyle={styles.trackingPanelContent}>
                    <Text style={styles.trackingTitle}>
                        {requestStatus === 'pending' ? 'Waiting for mechanic' : 'Help is on the way'}
                    </Text>
                    <Text style={styles.trackingSub}>Live map · Real roads & GPS tracking</Text>
                    {nearest && <Text style={styles.mechLine}>Notified: <Text style={styles.bold}>{nearest.name}</Text></Text>}

                    <View style={styles.actionRow}>
                        {activeRequest && nearest && (
                            <Button
                                style={styles.flex1}
                                onPress={() => navigation.navigate('Chat', {
                                    requestId: activeRequest.id,
                                    receiverId: nearest.user_id,
                                    name: nearest.name,
                                })}
                            >
                                Chat
                            </Button>
                        )}
                        {mechanicLocation && (
                            <Button style={styles.flex1} variant="secondary" onPress={() => openDirections(mechanicLocation.latitude, mechanicLocation.longitude)}>
                                Navigate
                            </Button>
                        )}
                        {userLocation && (
                            <Button style={styles.flex1} variant="secondary" onPress={() => openGoogleMaps(userLocation.latitude, userLocation.longitude, 'My location')}>
                                Share
                            </Button>
                        )}
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={[styles.container, status !== 'idle' && styles.activeContainer]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X size={28} color={status !== 'idle' ? 'white' : COLORS.textMain} />
                </TouchableOpacity>
            </View>

            {status === 'idle' && (
                <View style={styles.content}>
                    <Text style={styles.badge}>24/7 ROADSIDE HELP</Text>
                    <Text style={styles.title}>{t('emergencySOS')}</Text>
                    <Text style={styles.subtitle}>{t('broadcastSOS')}</Text>
                    <TouchableOpacity style={styles.sosButton} onPress={handleSOS} activeOpacity={0.85}>
                        <View style={styles.sosInner}>
                            <ShieldAlert size={72} color="white" />
                            <Text style={styles.sosText}>GET HELP</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {status === 'locating' && (
                <View style={styles.locatingContent}>
                    <View style={styles.radar} />
                    <Text style={styles.locatingTitle}>Finding help...</Text>
                    <Text style={styles.locatingSub}>Scanning real map data near you</Text>
                </View>
            )}

            {status === 'found' && nearest && (
                <View style={styles.foundContent}>
                    <View style={styles.foundMap}>
                        <LiveMap
                            userLocation={userLocation}
                            mechanics={[nearest]}
                            fitToCoordinates={fitCoords}
                            style={styles.mapFill}
                        />
                    </View>
                    <View style={styles.foundPanel}>
                        <Text style={styles.foundTitle}>Help found</Text>
                        <Text style={styles.foundSubtitle}>{formatDistance(nearest.distance_meters)} away</Text>
                        <Card style={styles.mechCard}>
                            <Text style={styles.mechName}>{nearest.name}</Text>
                            <Text style={styles.mechSpec}>{nearest.specialty}</Text>
                        </Card>
                        <View style={styles.actionRow}>
                            <Button style={styles.flex1} onPress={confirmRequest}>Request Help</Button>
                            <Button style={styles.flex1} variant="secondary" onPress={() => setStatus('idle')}>Cancel</Button>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark, padding: SPACING.xl },
    activeContainer: { backgroundColor: '#1a0808' },
    header: { paddingTop: 40, marginBottom: 20 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
    badge: { fontSize: 10, fontWeight: '800', color: COLORS.danger, letterSpacing: 1, marginBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.textMain, marginBottom: SPACING.sm },
    subtitle: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 48, paddingHorizontal: 20 },
    sosButton: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(239, 68, 68, 0.12)', justifyContent: 'center', alignItems: 'center' },
    sosInner: { width: 168, height: 168, borderRadius: 84, backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', ...SHADOW.fab },
    sosText: { color: 'white', fontSize: 18, fontWeight: '900', marginTop: 8, letterSpacing: 2 },
    locatingContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    locatingTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textMain, marginTop: 32 },
    locatingSub: { color: COLORS.textMuted, marginTop: 8 },
    radar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.danger, opacity: 0.6 },
    foundContent: { flex: 1 },
    foundMap: { height: '45%', borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.lg },
    mapFill: { flex: 1 },
    foundPanel: { flex: 1, alignItems: 'center' },
    foundTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textMain },
    foundSubtitle: { fontSize: 16, color: COLORS.brand, marginTop: 4, marginBottom: 16 },
    mechCard: { width: '100%', marginBottom: 16 },
    mechName: { fontSize: 20, fontWeight: '700', color: COLORS.textMain },
    mechSpec: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
    trackingContainer: { flex: 1, backgroundColor: COLORS.bgDark },
    trackingMap: { flex: 1, position: 'relative' },
    closeBtn: {
        position: 'absolute', top: 48, left: 16, zIndex: 10,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(15,15,15,0.85)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    trackingPanel: { maxHeight: '42%', backgroundColor: COLORS.bgCard, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl },
    trackingPanelContent: { padding: SPACING.xl, alignItems: 'center' },
    trackingTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textMain },
    trackingSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 },
    mechLine: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
    bold: { fontWeight: '700', color: COLORS.textMain },
    actionRow: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
    flex1: { flex: 1 },
});
