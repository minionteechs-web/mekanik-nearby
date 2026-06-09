import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, FlatList, Linking } from 'react-native';
import { MapPin, Bell, User, CheckCircle, Navigation, Phone } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getSocket, initSocket, requests, mechanics } from '../utils/api';
import { openDirections } from '../utils/maps';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAuth } from '../utils/authContext';
import { getCurrentLocation } from '../utils/geo';

export const MechanicDashboard = ({ navigation }) => {
    const { user } = useAuth();
    const [activeRequest, setActiveRequest] = useState(null);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [isAvailable, setIsAvailable] = useState(true);
    const [profile, setProfile] = useState(null);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        setupSocket();
        loadPendingRequests();
        checkProfile();
    }, []);

    const checkProfile = async () => {
        try {
            const res = await mechanics.getMyProfile();
            setProfile(res.data);
            setIsAvailable(res.data.is_available);
        } catch (err) {
            if (err.response?.status === 404) {
                navigation.replace('MechanicOnboard');
            }
        }
    };

    const loadPendingRequests = async () => {
        try {
            const response = await requests.getUserRequests();
            const pending = response.data.filter((r) => r.status === 'pending');
            const active = response.data.find((r) => ['accepted', 'en-route', 'arrived'].includes(r.status));
            setCompletedCount(response.data.filter((r) => r.status === 'completed').length);
            setIncomingRequests(pending);
            if (active) setActiveRequest(active);
        } catch (err) {
            console.error('Failed to load requests:', err);
        }
    };

    const setupSocket = async () => {
        const socket = await initSocket();
        if (socket) {
            socket.on('new_request', (data) => {
                setIncomingRequests(prev => [data, ...prev]);
                Alert.alert("New SOS Request!", "A driver nearby needs your assistance.");
            });

            socket.on('status_updated', (data) => {
                if (data.status === 'cancelled') {
                    setActiveRequest(null);
                    Alert.alert("Request Cancelled", "The driver has cancelled the help request.");
                }
            });
        }
    };

    useEffect(() => {
        let locationInterval;
        if (activeRequest && ['accepted', 'en-route', 'arrived'].includes(activeRequest.status)) {
            locationInterval = setInterval(async () => {
                const coords = await getCurrentLocation();
                if (coords) {
                    const socket = getSocket();
                    if (socket) {
                        socket.emit('location_update', {
                            requestId: activeRequest.id,
                            driverId: activeRequest.driver_id,
                            lat: coords.latitude,
                            lng: coords.longitude
                        });
                    }
                }
            }, 5000);
        }
        return () => clearInterval(locationInterval);
    }, [activeRequest]);

    const handleAccept = async (request) => {
        try {
            const response = await requests.accept(request.id);
            setActiveRequest(response.data);
            setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
        } catch (err) {
            Alert.alert("Error", "Could not accept request.");
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!activeRequest) return;
        try {
            const response = await requests.updateStatus(activeRequest.id, status);
            if (status === 'completed') {
                setActiveRequest(null);
                Alert.alert("Job Completed", "Well done!");
            } else {
                setActiveRequest(response.data);
            }
        } catch (err) {
            Alert.alert("Error", "Could not update status.");
        }
    };

    const renderRequest = ({ item }) => (
        <Card style={styles.requestCard}>
            <View style={styles.requestHeader}>
                <Text style={styles.requestTime}>Urgent</Text>
                {item.driver_lat ? <Text style={styles.requestDist}>Location shared</Text> : null}
            </View>
            <Text style={styles.requestDesc}>Emergency breakdown reported near your location.</Text>
            <Button onPress={() => handleAccept(item)} disabled={!!activeRequest}>
                Accept Help Request
            </Button>
        </Card>
    );

    return (
        <ScreenLayout navigation={navigation} currentRoute="MechanicHome">
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Mechanic Portal</Text>
                    <Text style={styles.subtitle}>Welcome, {user?.username}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.statusToggle, isAvailable ? styles.statusOnline : styles.statusOffline]}
                    onPress={async () => {
                        const next = !isAvailable;
                        try {
                            await mechanics.updateAvailability(next);
                            setIsAvailable(next);
                        } catch (err) {
                            Alert.alert('Error', 'Could not update availability');
                        }
                    }}
                >
                    <Text style={styles.statusText}>{isAvailable ? 'Online' : 'Offline'}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={incomingRequests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderRequest}
                ListHeaderComponent={
                    <>
                        {activeRequest && (
                            <Card style={styles.activeCard}>
                                <View style={styles.activeHeader}>
                                    <View style={styles.activeIndicator} />
                                    <Text style={styles.activeTitle}>Active Job: {activeRequest.status.toUpperCase()}</Text>
                                </View>

                                <View style={styles.driverInfo}>
                                    <User size={40} color={COLORS.brand} />
                                    <View style={styles.driverText}>
                                        <Text style={styles.driverName}>Driver ID: #{activeRequest.driver_id}</Text>
                                        <Text style={styles.distance}>Nearby (Tap to Navigate)</Text>
                                    </View>
                                </View>

                                <View style={styles.actionRow}>
                                    <Button
                                        style={styles.flex1}
                                        variant="secondary"
                                        onPress={() => activeRequest.driver_lat && openDirections(activeRequest.driver_lat, activeRequest.driver_lng)}
                                    >
                                        <Navigation size={18} color="white" style={{ marginRight: 8 }} /> Navigate
                                    </Button>
                                    <Button 
                                        style={styles.flex1} 
                                        variant="secondary"
                                        onPress={() => navigation.navigate('Chat', { requestId: activeRequest.id, receiverId: activeRequest.driver_id, name: 'Driver' })}
                                    >
                                        Chat
                                    </Button>
                                    <Button
                                        style={styles.flex1}
                                        variant="secondary"
                                        onPress={() => {
                                            if (activeRequest.driver_phone) {
                                                Linking.openURL(`tel:${activeRequest.driver_phone}`);
                                            } else {
                                                Alert.alert('No phone', 'Driver has no phone number on file.');
                                            }
                                        }}
                                    >
                                        <Phone size={18} color="white" style={{ marginRight: 8 }} /> Call
                                    </Button>
                                </View>

                                {activeRequest.status === 'accepted' && (
                                    <Button onPress={() => handleUpdateStatus('en-route')}>En-Route</Button>
                                )}
                                {activeRequest.status === 'en-route' && (
                                    <Button onPress={() => handleUpdateStatus('arrived')}>Arrived</Button>
                                )}
                                {activeRequest.status === 'arrived' && (
                                    <Button onPress={() => handleUpdateStatus('completed')}>Complete</Button>
                                )}
                            </Card>
                        )}
                        {!activeRequest && (
                            <View style={styles.statsRow}>
                                <Card style={styles.statCard}>
                                    <Text style={styles.statVal}>{completedCount}</Text>
                                    <Text style={styles.statLabel}>Jobs</Text>
                                </Card>
                                <Card style={styles.statCard}>
                                    <Text style={styles.statVal}>{profile?.rating?.toFixed(1) || '—'}</Text>
                                    <Text style={styles.statLabel}>Rating</Text>
                                </Card>
                            </View>
                        )}
                        <Text style={styles.sectionTitle}>Incoming Requests</Text>
                    </>
                }
                ListEmptyComponent={
                    !activeRequest && (
                        <View style={styles.emptyContainer}>
                            <Bell size={40} color="#333" />
                            <Text style={styles.emptyText}>No pending requests.</Text>
                        </View>
                    )
                }
                contentContainerStyle={styles.scroll}
            />
        </SafeAreaView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, paddingTop: 40 },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.brand },
    subtitle: { fontSize: 14, color: COLORS.textMuted },
    statusToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    statusOnline: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    statusOffline: { backgroundColor: 'rgba(100, 100, 100, 0.1)' },
    statusText: { fontWeight: '700', fontSize: 12, color: '#AAA' },
    scroll: { padding: SPACING.xl, paddingTop: 0, paddingBottom: 40 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    statCard: { flex: 1, alignItems: 'center', padding: SPACING.lg },
    statVal: { fontSize: 24, fontWeight: '800', color: COLORS.textMain },
    statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    activeCard: { borderWidth: 1, borderColor: COLORS.brand, backgroundColor: 'rgba(255, 107, 53, 0.05)', marginBottom: 40 },
    activeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
    activeIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.brand },
    activeTitle: { fontWeight: '800', color: COLORS.textMain, fontSize: 14 },
    driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
    driverName: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },
    distance: { color: COLORS.textMuted, fontSize: 14 },
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    flex1: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: 16 },
    requestCard: { marginBottom: 12 },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    requestTime: { color: COLORS.brand, fontWeight: '700', fontSize: 12 },
    requestDist: { color: COLORS.textMuted, fontSize: 12 },
    requestDesc: { color: COLORS.textMain, marginBottom: 16, lineHeight: 20 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#1A1A1A', borderRadius: RADIUS.lg },
    emptyText: { color: '#444', marginTop: 12, textAlign: 'center' },
});
