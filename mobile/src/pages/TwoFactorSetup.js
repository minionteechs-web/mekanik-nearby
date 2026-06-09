import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { ChevronLeft, ShieldCheck, Copy, RefreshCw } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { auth } from '../utils/api';

export const TwoFactorSetup = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');

    useEffect(() => {
        fetchSetupData();
    }, []);

    const fetchSetupData = async () => {
        setLoading(true);
        try {
            const response = await auth.setup2FA();
            setQrCode(response.data.qrCodeUrl);
            setSecret(response.data.secret);
        } catch (err) {
            Alert.alert("Error", "Could not fetch 2FA setup data. Please try again.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleEnable = async () => {
        if (code.length !== 6) {
            return Alert.alert("Error", "Please enter a 6-digit code.");
        }

        setVerifying(true);
        try {
            await auth.toggle2FA({ enable: true, code });
            Alert.alert("Success", "Two-Factor Authentication is now enabled!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            Alert.alert("Failed", err.response?.data?.message || "Invalid code. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.brand} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={28} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Two-Factor Setup</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.iconBox}>
                    <ShieldCheck size={60} color={COLORS.brand} />
                </View>
                
                <Text style={styles.stepTitle}>Step 1: Scan QR Code</Text>
                <Text style={styles.stepDesc}>Open your authenticator app (Google Authenticator, Authy, etc.) and scan the code below.</Text>

                <View style={styles.qrContainer}>
                    {qrCode && <Image source={{ uri: qrCode }} style={styles.qrImage} />}
                </View>

                <Text style={styles.stepTitle}>Step 2: Manual Entry (Optional)</Text>
                <Text style={styles.stepDesc}>If you can't scan, enter this secret key manually:</Text>
                
                <View style={styles.secretBox}>
                    <Text style={styles.secretText}>{secret}</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.stepTitle}>Step 3: Verify & Enable</Text>
                <Text style={styles.stepDesc}>Enter the 6-digit code from your app to confirm.</Text>

                <Input
                    label="Verification Code"
                    placeholder="000000"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.otpInput}
                />

                <Button
                    onPress={handleEnable}
                    loading={verifying}
                    style={styles.enableBtn}
                >
                    Enable 2FA
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textMain, marginLeft: SPACING.md },
    loadingContainer: { flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: SPACING.xl },
    iconBox: { alignItems: 'center', marginBottom: 24 },
    stepTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: 8 },
    stepDesc: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20, lineHeight: 20 },
    qrContainer: { backgroundColor: 'white', padding: 20, borderRadius: RADIUS.lg, alignSelf: 'center', marginBottom: 32 },
    qrImage: { width: 200, height: 200 },
    secretBox: { backgroundColor: '#1A1A1A', padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: 32, alignItems: 'center' },
    secretText: { color: COLORS.brand, fontWeight: '800', fontSize: 18, letterSpacing: 2 },
    otpInput: { letterSpacing: 10, textAlign: 'center', fontSize: 24, marginTop: 10 },
    enableBtn: { marginTop: 24, marginBottom: 40 },
    divider: { height: 1, backgroundColor: '#222', marginVertical: 32 },
});
