import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Navigation2, ChevronDown, ChevronUp, Flag } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export function RouteDirections({ steps = [], collapsedDefault = false }) {
    const [expanded, setExpanded] = useState(!collapsedDefault);

    if (!steps?.length) return null;

    const mainSteps = steps.filter((s) => s.distanceM > 0 || s.instruction.includes('Arrive'));

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
                <View style={styles.titleRow}>
                    <Navigation2 size={18} color={COLORS.brand} />
                    <Text style={styles.title}>Turn-by-turn directions</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{mainSteps.length} steps</Text>
                    </View>
                </View>
                {expanded ? <ChevronUp size={18} color={COLORS.textMuted} /> : <ChevronDown size={18} color={COLORS.textMuted} />}
            </TouchableOpacity>

            {expanded && (
                <ScrollView style={styles.list} nestedScrollEnabled>
                    {mainSteps.map((step, index) => (
                        <View key={step.id} style={styles.step}>
                            <View style={styles.marker}>
                                {step.instruction.includes('Arrive') ? (
                                    <Flag size={12} color={COLORS.brand} />
                                ) : (
                                    <Text style={styles.markerNum}>{index + 1}</Text>
                                )}
                            </View>
                            <View style={styles.stepBody}>
                                <Text style={styles.instruction}>{step.instruction}</Text>
                                <View style={styles.meta}>
                                    {step.distanceLabel !== '—' && (
                                        <Text style={styles.metaText}>{step.distanceLabel}</Text>
                                    )}
                                    {step.durationMin > 0 && (
                                        <Text style={styles.metaText}>~{step.durationMin} min</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textMain,
    },
    badge: {
        backgroundColor: COLORS.inputBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    list: {
        maxHeight: 240,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
    },
    step: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    marker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerNum: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.brand,
    },
    stepBody: { flex: 1 },
    instruction: {
        fontSize: 14,
        color: COLORS.textMain,
        lineHeight: 20,
    },
    meta: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
});
