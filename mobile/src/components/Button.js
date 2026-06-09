import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { RADIUS, SPACING } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

const createStyles = (colors) => ({
    button: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primary: { backgroundColor: colors.brand },
    secondary: {
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.border,
    },
    danger: { backgroundColor: colors.danger },
    text: { fontSize: 16, fontWeight: '600', color: colors.textMain },
    textPrimary: { color: '#FFFFFF' },
    textDanger: { color: '#FFFFFF' },
});

export const Button = ({ children, variant = 'primary', style, textStyle, ...props }) => {
    const styles = useThemedStyles(createStyles);
    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';
    const isDanger = variant === 'danger';

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
                <Text style={[styles.text, isPrimary && styles.textPrimary, isDanger && styles.textDanger, textStyle]}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </TouchableOpacity>
    );
};
