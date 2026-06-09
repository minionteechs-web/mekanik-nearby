import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const Button = ({ children, variant = 'primary', style, textStyle, ...props }) => {
    const isPrimary = variant === 'primary';
    const isDanger = variant === 'danger';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            style={[
                styles.button,
                isPrimary && styles.primary,
                isDanger && styles.danger,
                style,
            ]}
            {...props}
        >
            <Text
                style={[
                    styles.text,
                    isPrimary && styles.textPrimary,
                    isDanger && styles.textDanger,
                    textStyle,
                ]}
            >
                {children}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primary: {
        backgroundColor: COLORS.brand,
    },
    danger: {
        backgroundColor: COLORS.danger,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMain,
    },
    textPrimary: {
        color: '#FFFFFF',
    },
    textDanger: {
        color: '#FFFFFF',
    },
});
