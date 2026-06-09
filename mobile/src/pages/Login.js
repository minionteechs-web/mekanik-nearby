import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ShieldAlert, Compass, Wrench, User, Bell } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { auth } from '../utils/api';
import { useAuth } from '../utils/authContext';

export const Login = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 2FA States
    const [show2FA, setShow2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState('');
    const [preAuthToken, setPreAuthToken] = useState(null);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            return Alert.alert("Error", "Please fill in all fields");
        }

        setLoading(true);
        try {
            const response = await auth.login({ email, password });
            
            if (response.data.two_factor_required) {
                setPreAuthToken(response.data.pre_auth_token);
                setShow2FA(true);
                setLoading(false);
                return;
            }

            const { token, user } = response.data;
            await login(user, token);
            navigatePostLogin(user);
        } catch (err) {
            console.error(err);
            Alert.alert("Login Failed", err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (twoFACode.length !== 6) {
            return Alert.alert("Error", "Please enter a valid 6-digit code");
        }

        setLoading(true);
        try {
            const response = await auth.verify2FA({
                token: preAuthToken,
                code: twoFACode
            });

            const { token, user } = response.data;
            await login(user, token);
            navigatePostLogin(user);
        } catch (err) {
            console.error(err);
            Alert.alert("Verification Failed", err.response?.data?.message || "Invalid or expired code");
        } finally {
            setLoading(false);
        }
    };

    const navigatePostLogin = (user) => {
        if (user.role === 'mechanic') {
            navigation.replace('MechanicHome');
        } else {
            navigation.replace('Home');
        }
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail) return Alert.alert('Error', 'Enter your email');
        setLoading(true);
        try {
            const res = await auth.forgotPassword(forgotEmail);
            Alert.alert('Check your email', res.data.message + '\n\nIn development, check the backend console for the reset link.');
            setShowForgot(false);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    if (showForgot) {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setShowForgot(false)}>
                    <Text style={styles.backBtnText}>← Back to Login</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>
                <Input label="Email" value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" keyboardType="email-address" />
                <Button onPress={handleForgotPassword} loading={loading} style={styles.loginBtn}>Send Reset Link</Button>
            </View>
        );
    }

    if (show2FA) {
        return (
            <View style={styles.container}>
                <TouchableOpacity 
                    style={styles.backBtn} 
                    onPress={() => setShow2FA(false)}
                >
                    <Text style={styles.backBtnText}>← Back to Login</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Two-Factor Authentication</Text>
                <Text style={styles.subtitle}>Enter the 6-digit code from your authenticator app.</Text>

                <Input
                    label="Verification Code"
                    placeholder="000000"
                    value={twoFACode}
                    onChangeText={setTwoFACode}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.otpInput}
                />

                <Button
                    onPress={handleVerify2FA}
                    loading={loading}
                    style={styles.loginBtn}
                >
                    Verify & Log In
                </Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to Mekanik Nearby</Text>

            <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity onPress={() => setShowForgot(true)} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
                onPress={handleLogin}
                loading={loading}
                style={styles.loginBtn}
            >
                Log In
            </Button>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
        padding: SPACING.xl,
        justifyContent: 'center',
    },
    backBtn: {
        marginBottom: 20,
    },
    backBtnText: {
        color: COLORS.brand,
        fontWeight: '600',
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
    loginBtn: {
        marginTop: 20,
    },
    otpInput: {
        letterSpacing: 10,
        textAlign: 'center',
        fontSize: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
    },
    footerText: {
        color: COLORS.textMuted,
    },
    linkText: {
        color: COLORS.brand,
        fontWeight: '700',
    },
});
