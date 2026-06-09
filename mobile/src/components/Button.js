import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const Button = ({ children, variant = 'primary', style, textStyle, ...props }) => {
    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';
    const isDanger = variant === 'danger';
    const textStyles = [
        styles.text,
        isPrimary && styles.textPrimary,
        isDanger && styles.textDanger,
        textStyle,
    ];

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            style={[
                styles.button,
                isPrimary && styles.primary,
                isSecondary && styles.secondary,
                isDanger && styles.danger,
                style,
            ]}
            {...props}
        >
            {typeof children === 'string' || typeof children === 'number' ? (
                <Text style={textStyles}>{children}</Text>
            ) : (
                children
            )}
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
    secondary: {
        backgroundColor: COLORS.bgElevated,
        borderWidth: 1,
        borderColor: COLORS.border,
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
