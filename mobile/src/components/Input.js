import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { RADIUS, SPACING } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../utils/themeContext';

const createStyles = (colors) => ({
    container: {
        marginBottom: SPACING.lg,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    input: {
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        color: colors.textMain,
        fontSize: 16,
    },
});

export const Input = ({ label, style, readOnly = false, ...props }) => {
    const styles = useThemedStyles(createStyles);
    const { colors } = useTheme();

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                placeholderTextColor={colors.textSubtle}
                style={[styles.input, readOnly && { opacity: 0.65 }]}
                editable={!readOnly}
                {...props}
            />
        </View>
    );
};
