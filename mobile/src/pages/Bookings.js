import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import { ChevronLeft, Calendar } from 'lucide-react-native';
import { useTheme } from '../utils/themeContext';
import { bookings as bookingsApi, mechanics as mechanicsApi } from '../utils/api';
import { getCurrentLocation } from '../utils/geo';
import { ScreenLayout } from '../components/ScreenLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../utils/authContext';

const STATUS_LABELS = {
    pending: 'Awaiting confirmation',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

export function Bookings({ navigation }) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const isMechanic = user?.role === 'mechanic';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [mechanics, setMechanics] = useState([]);
    const [form, setForm] = useState({ mechanic_id: '', scheduled_at: '', service_type: 'General inspection', notes: '', address: '' });

    const load = async () => {
        try {
            const res = await bookingsApi.getAll();
            setItems(res.data);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        if (!isMechanic) {
            getCurrentLocation().then(async (coords) => {
                if (!coords) return;
                try {
                    const res = await mechanicsApi.getNearby(coords.latitude, coords.longitude, 50000);
                    setMechanics(res.data.slice(0, 20));
                } catch { /* ignore */ }
            });
        }
    }, [isMechanic]);

    const handleCreate = async () => {
        if (!form.mechanic_id || !form.scheduled_at || !form.service_type) {
            Alert.alert('Error', 'Mechanic, date, and service type are required');
            return;
        }
        try {
            await bookingsApi.create({
                ...form,
                mechanic_id: parseInt(form.mechanic_id, 10),
                scheduled_at: new Date(form.scheduled_at).toISOString(),
            });
            Alert.alert('Success', 'Booking request sent');
            setShowForm(false);
            load();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not create booking');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await bookingsApi.updateStatus(id, status);
            load();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Update failed');
        }
    };

    return (
        <ScreenLayout showTabBar={false}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>Bookings</Text>
                {!isMechanic && (
                    <TouchableOpacity onPress={() => setShowForm(!showForm)}>
                        <Text style={{ color: colors.brand, fontWeight: '700' }}>{showForm ? 'Close' : 'New'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {!isMechanic && showForm && (
                <ScrollView style={styles.form}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Mechanic user ID</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                        placeholder="Select from list below or enter user id"
                        placeholderTextColor={colors.textMuted}
                        value={form.mechanic_id}
                        onChangeText={(v) => setForm({ ...form, mechanic_id: v })}
                    />
                    {mechanics.map((m) => (
                        <TouchableOpacity key={m.user_id} onPress={() => setForm({ ...form, mechanic_id: String(m.user_id) })}>
                            <Text style={{ color: colors.brand, marginBottom: 4 }}>{m.name}</Text>
                        </TouchableOpacity>
                    ))}
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textMain }]} placeholder="Service type" placeholderTextColor={colors.textMuted} value={form.service_type} onChangeText={(v) => setForm({ ...form, service_type: v })} />
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textMain }]} placeholder="Notes" placeholderTextColor={colors.textMuted} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textMain }]} placeholder="Address" placeholderTextColor={colors.textMuted} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
                    <Text style={[styles.hint, { color: colors.textMuted }]}>Use ISO datetime e.g. 2026-06-15T10:00:00</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textMain }]} placeholder="Scheduled at (ISO)" placeholderTextColor={colors.textMuted} value={form.scheduled_at} onChangeText={(v) => setForm({ ...form, scheduled_at: v })} />
                    <Button onPress={handleCreate}>Request booking</Button>
                </ScrollView>
            )}

            {loading ? (
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>Loading...</Text>
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Calendar size={48} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, marginTop: 16 }}>No bookings yet</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <Card style={{ marginBottom: 12 }}>
                            <Text style={{ color: colors.textMain, fontWeight: '700' }}>{item.service_type}</Text>
                            <Text style={{ color: colors.textMuted }}>{new Date(item.scheduled_at).toLocaleString()}</Text>
                            <Text style={{ color: colors.brand, marginTop: 4 }}>{STATUS_LABELS[item.status] || item.status}</Text>
                            {item.mechanic_name && <Text style={{ color: colors.textMuted }}>Mechanic: {item.mechanic_name}</Text>}
                            {item.driver_name && <Text style={{ color: colors.textMuted }}>Driver: {item.driver_name}</Text>}
                            <View style={styles.actions}>
                                {isMechanic && item.status === 'pending' && (
                                    <>
                                        <Button size="sm" onPress={() => updateStatus(item.id, 'confirmed')}>Confirm</Button>
                                        <Button size="sm" variant="secondary" onPress={() => updateStatus(item.id, 'cancelled')}>Decline</Button>
                                    </>
                                )}
                                {isMechanic && item.status === 'confirmed' && (
                                    <Button size="sm" onPress={() => updateStatus(item.id, 'completed')}>Complete</Button>
                                )}
                                {!isMechanic && ['pending', 'confirmed'].includes(item.status) && (
                                    <Button size="sm" variant="secondary" onPress={() => updateStatus(item.id, 'cancelled')}>Cancel</Button>
                                )}
                            </View>
                        </Card>
                    )}
                />
            )}
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, marginLeft: 12 },
    empty: { alignItems: 'center', marginTop: 80 },
    form: { padding: 16 },
    label: { fontSize: 12, marginBottom: 4 },
    input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
    hint: { fontSize: 11, marginBottom: 8 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
