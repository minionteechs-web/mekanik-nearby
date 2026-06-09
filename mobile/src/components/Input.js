import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const Input = ({ label, style, ...props }) => {
    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                placeholderTextColor="#666"
                style={styles.input}
                {...props}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.lg,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    input: {
        backgroundColor: COLORS.inputBg,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        color: COLORS.textMain,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
});
