import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { auth } from '../utils/api';
import { useAuth } from '../utils/authContext';

export const Register = ({ navigation }) => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('driver');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!username || !email || !password) {
            return Alert.alert("Error", "Please fill in all required fields");
        }

        setLoading(true);
        try {
            const response = await auth.register({ username, email, password, phone, role });
            const { token, user } = response.data;
            await login(user, token);

            if (user.role === 'mechanic') {
                navigation.replace('MechanicOnboard');
            } else {
                navigation.replace('Home');
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Registration Failed", err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the network of drivers and mechanics</Text>

            <Input
                label="Username"
                placeholder="johndoe"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <Input
                label="Phone Number"
                placeholder="+234..."
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />
            <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>I am a:</Text>
                <View style={styles.roleButtons}>
                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'driver' && styles.roleBtnActive]}
                        onPress={() => setRole('driver')}
                    >
                        <Text style={[styles.roleBtnText, role === 'driver' && styles.roleBtnTextActive]}>Driver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'mechanic' && styles.roleBtnActive]}
                        onPress={() => setRole('mechanic')}
                    >
                        <Text style={[styles.roleBtnText, role === 'mechanic' && styles.roleBtnTextActive]}>Mechanic</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Button
                onPress={handleRegister}
                loading={loading}
                style={styles.registerBtn}
            >
                Sign Up
            </Button>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Log In</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: COLORS.bgDark,
        padding: SPACING.xl,
        paddingTop: 80,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.brand,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginBottom: 40,
    },
    roleContainer: {
        marginBottom: 24,
    },
    roleLabel: {
        color: COLORS.textMuted,
        marginBottom: 12,
        fontSize: 14,
    },
    roleButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    roleBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    roleBtnActive: {
        borderColor: COLORS.brand,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
    },
    roleBtnText: {
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    roleBtnTextActive: {
        color: COLORS.brand,
    },
    registerBtn: {
        marginTop: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    footerText: {
        color: COLORS.textMuted,
    },
    linkText: {
        color: COLORS.brand,
        fontWeight: '700',
    },
});
