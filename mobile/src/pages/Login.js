import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import { SPACING } from '../constants/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { auth } from '../utils/api';
import { useAuth } from '../utils/authContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

const createStyles = (colors) => ({
    container: {
        flex: 1,
        backgroundColor: colors.bgDark,
    },
    themeCorner: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        zIndex: 2,
    },
    scroll: {
        flexGrow: 1,
        padding: SPACING.xl,
        paddingTop: SPACING.xxl + SPACING.lg,
        justifyContent: 'center',
    },
    intro: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    backBtn: { marginBottom: 20 },
    backBtnText: { color: colors.brand, fontWeight: '600' },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: colors.textMain,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
        marginBottom: 32,
        textAlign: 'center',
    },
    loginBtn: { marginTop: 20 },
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
    footerText: { color: colors.textMuted },
    linkText: { color: colors.brand, fontWeight: '700' },
});

export const Login = ({ navigation }) => {
    const { login } = useAuth();
    const styles = useThemedStyles(createStyles);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [show2FA, setShow2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState('');
    const [preAuthToken, setPreAuthToken] = useState(null);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    const navigatePostLogin = (user) => {
        navigation.replace(user.role === 'mechanic' ? 'MechanicHome' : 'Home');
    };

    const handleLogin = async () => {
        if (!email || !password) {
            return Alert.alert('Error', 'Please fill in all fields');
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
            Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (twoFACode.length !== 6) {
            return Alert.alert('Error', 'Please enter a valid 6-digit code');
        }

        setLoading(true);
        try {
            const response = await auth.verify2FA({ token: preAuthToken, code: twoFACode });
            const { token, user } = response.data;
            await login(user, token);
            navigatePostLogin(user);
        } catch (err) {
            Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail) return Alert.alert('Error', 'Enter your email');
        setLoading(true);
        try {
            await auth.forgotPassword(forgotEmail);
            Alert.alert('Check your email', 'If that email exists, a reset link has been sent.');
            setShowForgot(false);
        } catch {
            Alert.alert('Error', 'Could not send reset link');
        } finally {
            setLoading(false);
        }
    };

    const renderBody = () => {
        if (showForgot) {
            return (
                <>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setShowForgot(false)}>
                        <Text style={styles.backBtnText}>← Back to Login</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>
                    <Input label="Email" value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" keyboardType="email-address" />
                    <Button onPress={handleForgotPassword} disabled={loading} style={styles.loginBtn}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </>
            );
        }

        if (show2FA) {
            return (
                <>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setShow2FA(false)}>
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
                    <Button onPress={handleVerify2FA} disabled={loading} style={styles.loginBtn}>
                        {loading ? 'Verifying...' : 'Verify & Log In'}
                    </Button>
                </>
            );
        }

        return (
            <>
                <View style={styles.intro}>
                    <BrandLogo size={72} />
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Login to find a mechanic nearby</Text>
                </View>
                <Input label="Email" placeholder="your@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
                <TouchableOpacity onPress={() => setShowForgot(true)} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                </TouchableOpacity>
                <Button onPress={handleLogin} disabled={loading} style={styles.loginBtn}>
                    {loading ? 'Logging In...' : 'Log In'}
                </Button>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.themeCorner}>
                <ThemeToggle compact />
            </View>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {renderBody()}
            </ScrollView>
        </SafeAreaView>
    );
};
