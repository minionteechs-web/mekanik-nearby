import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { Search, Filter, MapPin, Star } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { mechanics } from '../utils/api';
import { refreshUserLocation, getLocationErrorMessage } from '../utils/location';
import { getOfflineMechanicsNear } from '../utils/offlineMechanics';
import { formatDistance } from '../utils/format';
import { ScreenLayout } from '../components/ScreenLayout';

export const MechanicList = ({ navigation }) => {
    const [search, setSearch] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [fromCache, setFromCache] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMechanics();
    }, []);

    const fetchMechanics = async () => {
        setLoading(true);
        setFromCache(false);
        setError('');
        try {
            const location = await refreshUserLocation();
            try {
                const response = await mechanics.getNearby(location.lat, location.lng, 100000);
                setData(response.data);
            } catch (apiErr) {
                const offline = await getOfflineMechanicsNear(location.lat, location.lng);
                if (offline.length) {
                    setData(offline);
                    setFromCache(true);
                    setError('No signal — cached route mechanics near your GPS.');
                } else {
                    throw apiErr;
                }
            }
        } catch (err) {
            console.error(err);
            setError(getLocationErrorMessage(err));
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        return data
            .filter((item) => !onlineOnly || item.is_available)
            .filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.specialty.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity));
    }, [search, data, onlineOnly]);

    const renderItem = ({ item }) => (
        <Card
            style={styles.mechCard}
            onPress={() => navigation.navigate('MechanicDetail', { id: item.id })}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.mechName}>{item.name}</Text>
                    <Text style={styles.specialty}>{item.specialty}</Text>
                </View>
                <View style={[styles.statusBadge, item.is_available ? styles.online : styles.offline]}>
                    <Text style={styles.statusText}>{item.is_available ? 'Available' : 'Busy'}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Star size={16} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.footerText}>{item.rating} ({item.reviews_count} reviews)</Text>
                </View>
                <View style={styles.footerItem}>
                    <MapPin size={16} color={COLORS.brand} />
                    <Text style={styles.footerText}>{formatDistance(item.distance_meters)}</Text>
                </View>
            </View>
        </Card>
    );

    return (
        <ScreenLayout navigation={navigation} currentRoute="Mechanics">
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Find a Mechanic</Text>
                    {fromCache && <Text style={styles.cacheHint}>Showing offline cache</Text>}
                    {error && !loading && (
                        <>
                            <Text style={styles.errorHint}>{error}</Text>
                            <TouchableOpacity onPress={fetchMechanics}>
                                <Text style={styles.retryLink}>Retry location</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <View style={styles.searchBar}>
                <View style={styles.inputWrapper}>
                    <Search size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                    <Input
                        placeholder="Search by specialty or name..."
                        value={search}
                        onChangeText={setSearch}
                        style={styles.input}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, onlineOnly && styles.filterBtnActive]}
                    onPress={() => setOnlineOnly(!onlineOnly)}
                >
                    <Filter size={20} color="white" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={COLORS.brand} />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No mechanics found matching your search.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.xl,
        paddingTop: 60,
    },
    backBtn: {
        marginRight: SPACING.sm,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textMain,
    },
    cacheHint: {
        fontSize: 12,
        color: COLORS.brand,
        marginTop: 2,
    },
    errorHint: {
        fontSize: 12,
        color: COLORS.danger,
        marginTop: 4,
        lineHeight: 18,
    },
    retryLink: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.brand,
        marginTop: 4,
    },
    filterBtnActive: {
        backgroundColor: '#c44d20',
    },
    searchBar: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.xl,
        gap: 12,
        marginBottom: SPACING.lg,
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        top: 14,
        zIndex: 1,
    },
    input: {
        paddingLeft: 40,
    },
    filterBtn: {
        backgroundColor: COLORS.brand,
        width: 48,
        height: 48,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: SPACING.xl,
        paddingTop: 0,
        paddingBottom: 40,
    },
    mechCard: {
        marginBottom: SPACING.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
    },
    mechName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textMain,
    },
    specialty: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
    },
    online: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    offline: {
        backgroundColor: 'rgba(100, 100, 100, 0.1)',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: SPACING.md,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
