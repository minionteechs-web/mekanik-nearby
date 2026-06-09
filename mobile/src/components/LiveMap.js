import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { DARK_MAP_STYLE, DEFAULT_REGION } from '../constants/mapStyles';

let MapView, Marker, Circle, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export function LiveMap({
    region,
    userLocation,
    mechanics = [],
    trackingLocation = null,
    onMechanicPress,
    style,
    fitToCoordinates,
}) {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current || !fitToCoordinates?.length) return;
        mapRef.current.fitToCoordinates(fitToCoordinates, {
            edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
            animated: true,
        });
    }, [fitToCoordinates]);

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.fallback, style]}>
                <Text style={styles.fallbackIcon}>🗺️</Text>
                <Text style={styles.fallbackTitle}>Live street map</Text>
                <Text style={styles.fallbackText}>
                    Use the Android or iOS app for the full Google Maps experience with real roads and live tracking.
                </Text>
            </View>
        );
    }

    const mapRegion = region || DEFAULT_REGION;

    return (
        <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={[styles.map, style]}
            initialRegion={mapRegion}
            customMapStyle={DARK_MAP_STYLE}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            showsTraffic={false}
            mapType="standard"
        >
            {userLocation && (
                <Circle
                    center={userLocation}
                    radius={80}
                    fillColor="rgba(59, 130, 246, 0.15)"
                    strokeColor="rgba(59, 130, 246, 0.4)"
                    strokeWidth={1}
                />
            )}

            {mechanics.map((mech) =>
                mech.lat != null && mech.lng != null ? (
                    <Marker
                        key={mech.id}
                        coordinate={{ latitude: mech.lat, longitude: mech.lng }}
                        title={mech.name}
                        description={mech.specialty}
                        pinColor={mech.is_available ? '#FF6B35' : '#9CA3AF'}
                        onPress={() => onMechanicPress?.(mech)}
                    />
                ) : null
            )}

            {trackingLocation?.latitude != null && (
                <Marker
                    coordinate={trackingLocation}
                    title={trackingLocation.title || 'En route'}
                    pinColor="#3B82F6"
                />
            )}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    fallback: {
        flex: 1,
        backgroundColor: '#1a2332',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    fallbackIcon: { fontSize: 40, marginBottom: 12 },
    fallbackTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: 8 },
    fallbackText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});
