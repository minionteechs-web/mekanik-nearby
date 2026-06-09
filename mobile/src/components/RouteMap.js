import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { DEFAULT_REGION } from '../constants/mapStyles';

let MapView, Marker, Polyline, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export function RouteMap({ path = [], start, end, mechanics = [], userLocation = null, height = 260 }) {
    const mapRef = useRef(null);

    const coordinates = useMemo(
        () => path.map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
        [path]
    );

    useEffect(() => {
        if (!mapRef.current) return;
        const fit = [...coordinates];
        if (userLocation?.lat != null) {
            fit.push({ latitude: userLocation.lat, longitude: userLocation.lng });
        }
        if (fit.length < 2) return;
        mapRef.current.fitToCoordinates(fit, {
            edgePadding: { top: 50, right: 40, bottom: 50, left: 40 },
            animated: true,
        });
    }, [coordinates, userLocation]);

    if (Platform.OS === 'web' || !MapView) {
        return (
            <View style={[styles.fallback, { height }]}>
                <Text style={styles.fallbackIcon}>🗺️</Text>
                <Text style={styles.fallbackTitle}>Route map</Text>
                <Text style={styles.fallbackText}>
                    {start?.label || start?.name} → {end?.label || end?.name}
                </Text>
            </View>
        );
    }

    const initialRegion = coordinates[0]
        ? { latitude: coordinates[0].latitude, longitude: coordinates[0].longitude, latitudeDelta: 2, longitudeDelta: 2 }
        : DEFAULT_REGION;

    return (
        <View style={[styles.wrapper, { height }]}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={!userLocation}
                showsCompass
            >
                {userLocation?.lat != null && (
                    <Marker
                        coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
                        title="You are here"
                        description={userLocation.label || 'Breakdown location'}
                        pinColor="#3B82F6"
                    />
                )}
                {coordinates.length > 1 && (
                    <Polyline
                        coordinates={coordinates}
                        strokeColor={COLORS.brand}
                        strokeWidth={4}
                    />
                )}

                {start?.lat != null && (
                    <Marker
                        coordinate={{ latitude: start.lat, longitude: start.lng }}
                        title="Start"
                        description={start.label || start.name}
                        pinColor="#10B981"
                    />
                )}

                {end?.lat != null && (
                    <Marker
                        coordinate={{ latitude: end.lat, longitude: end.lng }}
                        title="Destination"
                        description={end.label || end.name}
                        pinColor="#EF4444"
                    />
                )}

                {mechanics.map((m) =>
                    m.lat != null && m.lng != null ? (
                        <Marker
                            key={m.id}
                            coordinate={{ latitude: m.lat, longitude: m.lng }}
                            title={m.name}
                            description={m.specialty}
                            pinColor={m.is_available ? COLORS.brand : '#9CA3AF'}
                        />
                    ) : null
                )}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    map: {
        flex: 1,
    },
    fallback: {
        backgroundColor: '#1a2332',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    fallbackIcon: { fontSize: 36, marginBottom: 8 },
    fallbackTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, marginBottom: 4 },
    fallbackText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});
