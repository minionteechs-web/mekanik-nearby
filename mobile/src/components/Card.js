import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { RADIUS, SPACING, SHADOW } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

const createStyles = (colors) => ({
    card: {
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: colors.border,
        ...SHADOW.card,
    },
});

export const Card = ({ children, style, onPress, ...props }) => {
    const styles = useThemedStyles(createStyles);
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.card, style]}
            {...props}
        >
            {children}
        </Container>
    );
};
