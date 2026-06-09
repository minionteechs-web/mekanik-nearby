import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mountain, Coffee, MapPin, ExternalLink } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { openRestStopInGoogleMaps } from '../utils/maps';

const ElevationChart = ({ points, minM, maxM }) => {
    if (!points?.length) {
        return <Text style={styles.empty}>Elevation data unavailable for this route.</Text>;
    }

    const range = Math.max(maxM - minM, 1);

    return (
        <View>
            <View style={styles.bars}>
                {points.map((p, i) => {
                    const height = ((p.elevationM - minM) / range) * 100;
                    return (
                        <View key={i} style={styles.barWrap}>
                            <View style={[styles.bar, { height: `${Math.max(height, 8)}%` }]} />
                            <Text style={styles.barLabel}>{p.elevationM}m</Text>
                        </View>
                    );
                })}
            </View>
            <View style={styles.legend}>
                <Text style={styles.legendText}>Low {minM} m</Text>
                <Text style={styles.legendText}>High {maxM} m</Text>
            </View>
        </View>
    );
};

export function RouteInsights({ elevation, restStops = [] }) {
    const gain = elevation?.gainM ?? 0;

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <View style={styles.heading}>
                    <Mountain size={18} color={COLORS.trust} />
                    <Text style={styles.headingText}>Elevation profile</Text>
                    {gain > 0 && (
                        <View style={styles.gainBadge}>
                            <Text style={styles.gainText}>+{gain} m climb</Text>
                        </View>
                    )}
                </View>
                <ElevationChart
                    points={elevation?.points}
                    minM={elevation?.minM}
                    maxM={elevation?.maxM}
                />
            </View>

            {restStops.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.heading}>
                        <Coffee size={18} color={COLORS.brand} />
                        <Text style={styles.headingText}>Suggested rest stops</Text>
                    </View>
                    {restStops.map((stop) => (
                        <View key={stop.id} style={styles.stopCard}>
                            <View style={styles.stopMain}>
                                <MapPin size={16} color={COLORS.brand} />
                                <View style={styles.stopInfo}>
                                    <Text style={styles.stopLabel}>{stop.label}</Text>
                                    <Text style={styles.stopMeta}>
                                        ~{stop.kmFromStart} km
                                        {stop.driveMinSoFar != null && ` · ~${stop.driveMinSoFar} min drive`}
                                    </Text>
                                    <Text style={styles.stopTip}>{stop.tip}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.mapBtn}
                                onPress={() => openRestStopInGoogleMaps(stop)}
                            >
                                <ExternalLink size={14} color={COLORS.brand} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.lg,
        gap: SPACING.lg,
    },
    section: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: SPACING.md,
    },
    headingText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textMain,
        flex: 1,
    },
    gainBadge: {
        backgroundColor: 'rgba(96, 165, 250, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.pill,
    },
    gainText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#60A5FA',
    },
    empty: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    bars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 72,
        gap: 6,
    },
    barWrap: {
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bar: {
        width: '100%',
        maxWidth: 28,
        backgroundColor: '#3B82F6',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        minHeight: 4,
    },
    barLabel: {
        fontSize: 9,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    legendText: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    stopCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: SPACING.md,
        backgroundColor: COLORS.inputBg,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 8,
    },
    stopMain: {
        flexDirection: 'row',
        gap: 10,
        flex: 1,
    },
    stopInfo: { flex: 1 },
    stopLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMain,
    },
    stopMeta: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    stopTip: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
        marginTop: 4,
        lineHeight: 16,
    },
    mapBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
