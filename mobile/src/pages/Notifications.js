import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useTheme } from '../utils/themeContext';
import { notifications as notificationsApi, initSocket } from '../utils/api';
import { ScreenLayout } from '../components/ScreenLayout';

export function Notifications({ navigation }) {
    const { colors } = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await notificationsApi.getAll();
            setItems(res.data);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        initSocket().then((socket) => {
            if (socket) socket.on('notification', load);
        });
    }, []);

    return (
        <ScreenLayout showTabBar={false}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>Notifications</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Bell size={48} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, marginTop: 16 }}>No notifications yet</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.item,
                                { backgroundColor: item.is_read ? colors.bgCard : `${colors.brand}15`, borderColor: colors.border },
                            ]}
                            onPress={() => notificationsApi.markRead(item.id).then(load)}
                        >
                            <Text style={[styles.itemTitle, { color: colors.textMain }]}>{item.title}</Text>
                            {item.body ? <Text style={{ color: colors.textMuted }}>{item.body}</Text> : null}
                            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
                                {new Date(item.created_at).toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 80 },
    item: { padding: 16, borderBottomWidth: 1 },
    itemTitle: { fontWeight: '600', marginBottom: 4 },
});
