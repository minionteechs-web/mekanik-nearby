import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../utils/themeContext';
import { auth } from '../utils/api';

export function ResetPassword({ navigation, route }) {
    const { colors } = useTheme();
    const token = route.params?.token || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        if (password !== confirm) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (!token) {
            Alert.alert('Error', 'Invalid reset link');
            return;
        }

        setLoading(true);
        try {
            await auth.resetPassword({ token, password });
            setDone(true);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
                <Text style={[styles.title, { color: colors.textMain }]}>Password Updated</Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
                    You can now log in with your new password.
                </Text>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.brand }]} onPress={() => navigation.replace('Login')}>
                    <Text style={styles.btnText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
            <Text style={[styles.title, { color: colors.textMain }]}>Reset Password</Text>
            <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                placeholder="New password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                placeholder="Confirm password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
            />
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.brand }]} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Update Password</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
    btn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
    btnText: { fontWeight: '700', fontSize: 16, color: '#000' },
});
