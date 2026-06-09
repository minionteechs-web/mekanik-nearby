import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from '../constants/theme';

export const Card = ({ children, style, onPress, ...props }) => {
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

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        ...SHADOW.card,
    },
});
