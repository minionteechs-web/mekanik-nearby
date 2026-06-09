import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { Car, Wrench, Shield, Award } from 'lucide-react-native';
import { SPACING, RADIUS } from '../constants/theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { MECHANIC_SPECIALTIES, ROLE_OPTIONS } from '../constants/registerConfig';
import { auth } from '../utils/api';
import { useAuth } from '../utils/authContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../utils/themeContext';

const INITIAL = {
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'driver',
    workshopName: '',
    specialty: MECHANIC_SPECIALTIES[0],
    city: '',
    state: '',
    yearsExperience: '',
    certification: '',
};

const createStyles = (colors) => ({
    container: { flex: 1, backgroundColor: colors.bgDark },
    themeCorner: { position: 'absolute', top: SPACING.md, right: SPACING.md, zIndex: 2 },
    scroll: { flexGrow: 1, padding: SPACING.xl, paddingTop: SPACING.xxl + SPACING.lg, paddingBottom: SPACING.xxl },
    intro: { alignItems: 'center', marginBottom: SPACING.lg },
    title: { fontSize: 28, fontWeight: '800', color: colors.textMain, marginBottom: 6, textAlign: 'center' },
    subtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: SPACING.lg },
    roleCards: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    roleCard: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bgCard,
        gap: 4,
    },
    roleCardActive: { borderColor: colors.brand, backgroundColor: `${colors.brand}12` },
    roleCardTitle: { fontSize: 14, fontWeight: '800', color: colors.textMain },
    roleCardDesc: { fontSize: 11, color: colors.textMuted },
    panelDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: SPACING.lg },
    chip: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bgElevated,
        overflow: 'hidden',
    },
    infoBox: {
        flexDirection: 'row',
        gap: 10,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        marginBottom: SPACING.lg,
    },
    infoBoxMech: {
        backgroundColor: `${colors.brand}14`,
        borderColor: `${colors.brand}33`,
    },
    infoText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
    specialtyLabel: { fontSize: 14, color: colors.textMuted, marginBottom: SPACING.xs, fontWeight: '500' },
    specialtyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.lg },
    specialtyPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: colors.border,
    },
    specialtyPillActive: { borderColor: colors.brand, backgroundColor: `${colors.brand}18` },
    specialtyText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
    specialtyTextActive: { color: colors.brand },
    fieldRow: { flexDirection: 'row', gap: SPACING.sm },
    fieldHalf: { flex: 1, minWidth: 0 },
    registerBtn: { marginTop: SPACING.md },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
    footerText: { color: colors.textMuted },
    linkText: { color: colors.brand, fontWeight: '700' },
});

export const Register = ({ navigation }) => {
    const { login } = useAuth();
    const { colors } = useTheme();
    const styles = useThemedStyles(createStyles);
    const [form, setForm] = useState(INITIAL);
    const [loading, setLoading] = useState(false);
    const roleMeta = ROLE_OPTIONS[form.role];

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const selectRole = (role) => {
        setForm({ ...INITIAL, role });
    };

    const handleRegister = async () => {
        const payload = {
            username: form.username.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password,
            role: form.role,
        };

        if (form.role === 'mechanic') {
            Object.assign(payload, {
                workshopName: form.workshopName.trim(),
                specialty: form.specialty,
                city: form.city.trim(),
                state: form.state.trim(),
                yearsExperience: form.yearsExperience,
                certification: form.certification.trim(),
            });
        }

        if (!payload.username || !payload.email || !payload.password) {
            return Alert.alert('Error', 'Please fill in all required fields');
        }

        setLoading(true);
        try {
            const response = await auth.register(payload);
            const { token, user } = response.data;
            await login(user, token);
            navigation.replace(user.role === 'mechanic' ? 'MechanicOnboard' : 'Home');
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.themeCorner}>
                <ThemeToggle compact />
            </View>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.intro}>
                    <BrandLogo size={72} />
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>{roleMeta.tagline}</Text>
                </View>

                <View style={styles.roleCards}>
                    <TouchableOpacity
                        style={[styles.roleCard, form.role === 'driver' && styles.roleCardActive]}
                        onPress={() => selectRole('driver')}
                    >
                        <Car size={20} color={form.role === 'driver' ? colors.brand : colors.textMuted} />
                        <Text style={styles.roleCardTitle}>Driver</Text>
                        <Text style={styles.roleCardDesc}>Need help on the road</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleCard, form.role === 'mechanic' && styles.roleCardActive]}
                        onPress={() => selectRole('mechanic')}
                    >
                        <Wrench size={20} color={form.role === 'mechanic' ? colors.brand : colors.textMuted} />
                        <Text style={styles.roleCardTitle}>Mechanic</Text>
                        <Text style={styles.roleCardDesc}>Offer roadside service</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.panelDesc}>{roleMeta.description}</Text>
                <View style={styles.chips}>
                    {roleMeta.chips.map((chip) => (
                        <Text key={chip} style={styles.chip}>{chip}</Text>
                    ))}
                </View>

                <Input
                    label={form.role === 'mechanic' ? 'Your full name' : 'Full name'}
                    value={form.username}
                    onChangeText={(v) => setField('username', v)}
                    placeholder="e.g. Chidi Okafor"
                />
                <Input label="Email address" value={form.email} onChangeText={(v) => setField('email', v)} autoCapitalize="none" keyboardType="email-address" />
                <Input
                    label={form.role === 'mechanic' ? 'Business phone' : 'Mobile number (SOS callbacks)'}
                    value={form.phone}
                    onChangeText={(v) => setField('phone', v)}
                    keyboardType="phone-pad"
                    placeholder="+234 800 000 0000"
                />
                <Input label="Password" value={form.password} onChangeText={(v) => setField('password', v)} secureTextEntry placeholder="Min. 6 characters" />

                {form.role === 'driver' && (
                    <View style={styles.infoBox}>
                        <Shield size={18} color={colors.brand} />
                        <Text style={styles.infoText}>
                            Your phone is shared with mechanics only when you send an SOS.
                        </Text>
                    </View>
                )}

                {form.role === 'mechanic' && (
                    <>
                        <Input
                            label="Workshop / business name"
                            value={form.workshopName}
                            onChangeText={(v) => setField('workshopName', v)}
                            placeholder="e.g. Ade Auto Works"
                        />
                        <Text style={styles.specialtyLabel}>Primary specialty</Text>
                        <View style={styles.specialtyRow}>
                            {MECHANIC_SPECIALTIES.map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.specialtyPill, form.specialty === s && styles.specialtyPillActive]}
                                    onPress={() => setField('specialty', s)}
                                >
                                    <Text style={[styles.specialtyText, form.specialty === s && styles.specialtyTextActive]}>
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldHalf}>
                                <Input label="City" value={form.city} onChangeText={(v) => setField('city', v)} placeholder="Lagos" style={{ marginBottom: 0 }} />
                            </View>
                            <View style={styles.fieldHalf}>
                                <Input label="State" value={form.state} onChangeText={(v) => setField('state', v)} placeholder="Lagos" style={{ marginBottom: 0 }} />
                            </View>
                        </View>
                        <Input label="Years of experience (optional)" value={form.yearsExperience} onChangeText={(v) => setField('yearsExperience', v)} keyboardType="number-pad" />
                        <Input label="Certification (optional)" value={form.certification} onChangeText={(v) => setField('certification', v)} placeholder="NADDC, trade test..." />
                        <View style={[styles.infoBox, styles.infoBoxMech]}>
                            <Award size={18} color={colors.brand} />
                            <Text style={styles.infoText}>
                                Next: pin your workshop on the map so drivers can find you when you go online.
                            </Text>
                        </View>
                    </>
                )}

                <Button onPress={handleRegister} disabled={loading} style={styles.registerBtn}>
                    {loading ? 'Creating account...' : roleMeta.cta}
                </Button>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
