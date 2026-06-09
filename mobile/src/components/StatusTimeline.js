import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const STEPS = [
    { key: 'pending', label: 'Request sent' },
    { key: 'accepted', label: 'Mechanic accepted' },
    { key: 'en-route', label: 'En route to you' },
    { key: 'arrived', label: 'Mechanic arrived' },
];

const statusOrder = ['pending', 'accepted', 'en-route', 'arrived', 'completed'];

export function StatusTimeline({ currentStatus }) {
    const currentIndex = statusOrder.indexOf(currentStatus);

    return (
        <View style={styles.container}>
            {STEPS.map((step, index) => {
                const isDone = currentIndex > index || currentStatus === 'completed';
                const isActive = currentIndex === index && currentStatus !== 'completed';

                return (
                    <View key={step.key} style={styles.step}>
                        <View style={[styles.dot, isDone && styles.dotDone, isActive && styles.dotActive]}>
                            {isDone ? (
                                <CheckCircle size={16} color={COLORS.success} />
                            ) : isActive ? (
                                <ActivityIndicator size="small" color={COLORS.brand} />
                            ) : (
                                <Circle size={16} color={COLORS.textMuted} />
                            )}
                        </View>
                        <Text style={[styles.label, isDone && styles.labelDone, isActive && styles.labelActive]}>
                            {step.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: COLORS.inputBg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    dot: {
        width: 28,
        alignItems: 'center',
    },
    dotDone: {},
    dotActive: {},
    label: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    labelDone: {
        color: COLORS.success,
        fontWeight: '600',
    },
    labelActive: {
        color: COLORS.brand,
        fontWeight: '700',
    },
});
