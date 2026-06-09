import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { mechanics } from '../utils/api';
import { getCurrentLocation } from '../utils/geo';

export const MechanicOnboard = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        address: '',
        city: '',
        state: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!formData.name || !formData.specialty || !formData.address || !formData.city) {
            return Alert.alert('Error', 'Please fill in all required fields');
        }

        setLoading(true);
        try {
            const coords = await getCurrentLocation();
            if (!coords) {
                return Alert.alert('Error', 'Location permission is required to set up your profile');
            }

            await mechanics.onboard({
                ...formData,
                lat: coords.latitude,
                lng: coords.longitude,
            });

            navigation.replace('MechanicHome');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Set Up Your Profile</Text>
            <Text style={styles.subtitle}>Tell drivers who you are and where you work</Text>

            <Input label="Business Name" placeholder="Ade Auto Works" value={formData.name} onChangeText={(v) => setFormData({ ...formData, name: v })} />
            <Input label="Specialty" placeholder="Engine & Transmission" value={formData.specialty} onChangeText={(v) => setFormData({ ...formData, specialty: v })} />
            <Input label="Address" placeholder="Street address" value={formData.address} onChangeText={(v) => setFormData({ ...formData, address: v })} />
            <Input label="City" placeholder="Lagos" value={formData.city} onChangeText={(v) => setFormData({ ...formData, city: v })} />
            <Input label="State" placeholder="Lagos" value={formData.state} onChangeText={(v) => setFormData({ ...formData, state: v })} />

            <Button onPress={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: COLORS.bgDark, padding: SPACING.xl, paddingTop: 80 },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.textMain, marginBottom: 8 },
    subtitle: { fontSize: 16, color: COLORS.textMuted, marginBottom: 32 },
});
