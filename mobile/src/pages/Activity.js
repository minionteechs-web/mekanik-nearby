import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { ScreenLayout } from '../components/ScreenLayout';
import { requests } from '../utils/api';
import { getStatusLabel } from '../utils/format';

export const Activity = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        requests.getUserRequests()
            .then((res) => setItems(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const statusColor = (status) => {
        if (['accepted', 'en-route', 'arrived'].includes(status)) return COLORS.trust;
        if (status === 'completed') return COLORS.success;
        if (status === 'cancelled') return COLORS.textMuted;
        return COLORS.brand;
    };

    return (
        <ScreenLayout navigation={navigation} currentRoute="Activity">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Activity</Text>
                    <Text style={styles.subtitle}>Your help requests and history</Text>
                </View>

                {loading ? (
                    <Text style={styles.empty}>Loading...</Text>
                ) : items.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <ClipboardList size={40} color={COLORS.brand} style={{ opacity: 0.5 }} />
                        <Text style={styles.emptyTitle}>No activity yet</Text>
                        <Text style={styles.empty}>Request help via SOS and track it here.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('SOS', { trackId: item.id })}
                            >
                                <View style={styles.cardTop}>
                                    <Text style={[styles.badge, { color: statusColor(item.status) }]}>
                                        {getStatusLabel(item.status)}
                                    </Text>
                                    <Text style={styles.date}>
                                        {new Date(item.requested_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={styles.cardTitle}>
                                    {item.mechanic_name ? `Help from ${item.mechanic_name}` : `Request #${item.id}`}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    header: { padding: SPACING.xl, paddingTop: 48 },
    title: { fontSize: 26, fontWeight: '800', color: COLORS.brand },
    subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
    list: { padding: SPACING.xl, paddingTop: 0, gap: SPACING.md },
    card: {
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
    badge: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    date: { fontSize: 12, color: COLORS.textSubtle },
    cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textMain },
    emptyBox: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.sm },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },
    empty: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
});
