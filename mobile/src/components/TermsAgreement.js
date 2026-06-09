import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../utils/themeContext';

export function TermsAgreement({ checked, onChange, onOpenTerms }) {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={() => onChange(!checked)}
            activeOpacity={0.8}
        >
            <View
                style={[
                    styles.checkbox,
                    {
                        borderColor: checked ? colors.brand : colors.border,
                        backgroundColor: checked ? colors.brand : 'transparent',
                    },
                ]}
            >
                {checked && <Check size={14} color="#fff" strokeWidth={3} />}
            </View>
            <Text style={[styles.text, { color: colors.textMuted }]}>
                I agree to the{' '}
                <Text style={[styles.link, { color: colors.brand }]} onPress={onOpenTerms}>
                    Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={[styles.link, { color: colors.brand }]} onPress={onOpenTerms}>
                    Privacy Policy
                </Text>
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
        marginTop: SPACING.sm,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: RADIUS.sm,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    text: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    link: {
        fontWeight: '700',
    },
});
