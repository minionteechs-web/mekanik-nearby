import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { Car, Settings, Wrench } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../utils/authContext';

export const Splash = ({ navigation }) => {
    const { user, loading } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const carAnim = useRef(new Animated.Value(-100)).current;
    const gearRotate = useRef(new Animated.Value(0)).current;
    const wrenchRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Initial fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
        }).start();

        // Car moving in from the left
        Animated.spring(carAnim, {
            toValue: 0,
            friction: 4,
            tension: 40,
            useNativeDriver: Platform.OS !== 'web',
        }).start();

        // Gear continuous rotation
        Animated.loop(
            Animated.timing(gearRotate, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: Platform.OS !== 'web',
            })
        ).start();

        // Wrench rocking back and forth
        Animated.loop(
            Animated.sequence([
                Animated.timing(wrenchRotate, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(wrenchRotate, {
                    toValue: -1,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: Platform.OS !== 'web',
                })
            ])
        ).start();

        if (loading) return;

        const timer = setTimeout(() => {
            if (user) {
                navigation.replace(user.role === 'mechanic' ? 'MechanicHome' : 'Home');
            } else {
                navigation.replace('Login');
            }
        }, 3500);

        return () => clearTimeout(timer);
    }, [navigation, user, loading]);

    const gearSpin = gearRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const wrenchSwing = wrenchRotate.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-15deg', '45deg']
    });

    return (
        <View style={styles.container}>
            <View style={styles.animationContainer}>
                <Animated.View style={[styles.carWrapper, { transform: [{ translateX: carAnim }] }]}>
                    <Car size={64} color={COLORS.brand} />
                </Animated.View>

                <View style={styles.toolsWrapper}>
                    <Animated.View style={{ transform: [{ rotate: gearSpin }] }}>
                        <Settings size={32} color={COLORS.brand} style={styles.toolIcon} />
                    </Animated.View>
                    <Animated.View style={{ transform: [{ rotate: wrenchSwing }] }}>
                        <Wrench size={32} color={COLORS.brand} style={styles.toolIcon} />
                    </Animated.View>
                </View>
            </View>

            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                <Text style={styles.logo}>Mekanik NG</Text>
                <Text style={styles.tagline}>Because every journey deserves a happy ending.</Text>
            </Animated.View>

            <View style={styles.loaderContainer}>
                <View style={styles.loader} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    animationContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    carWrapper: {
        marginBottom: 10,
    },
    toolsWrapper: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 10,
    },
    toolIcon: {
        opacity: 0.8,
    },
    logo: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.brand,
        marginBottom: SPACING.xs,
    },
    tagline: {
        fontSize: 18,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    loaderContainer: {
        marginTop: 40,
    },
    loader: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: 'rgba(255, 107, 53, 0.2)',
        borderTopColor: COLORS.brand,
    },
});

