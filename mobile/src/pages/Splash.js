import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Platform } from 'react-native';
import { SPACING } from '../constants/theme';
import { useAuth } from '../utils/authContext';
import { BrandLogo } from '../components/BrandLogo';
import { useThemedStyles } from '../hooks/useThemedStyles';

const createStyles = (colors) => ({
    container: {
        flex: 1,
        backgroundColor: colors.bgDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    tagline: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: SPACING.lg,
        maxWidth: 280,
        lineHeight: 22,
    },
    loaderContainer: { marginTop: 40 },
    loader: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: `${colors.brand}33`,
        borderTopColor: colors.brand,
    },
    pinTrail: {
        position: 'absolute',
        bottom: '18%',
        opacity: 0.08,
    },
});

export const Splash = ({ navigation }) => {
    const { user, loading } = useAuth();
    const styles = useThemedStyles(createStyles);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 900,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start();
    }, [fadeAnim, scaleAnim]);

    useEffect(() => {
        if (loading) return;

        const timer = setTimeout(() => {
            if (user) {
                navigation.replace(user.role === 'mechanic' ? 'MechanicHome' : 'Home');
            } else {
                navigation.replace('Login');
            }
        }, 2800);

        return () => clearTimeout(timer);
    }, [navigation, user, loading]);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <BrandLogo size={120} />
                <Text style={styles.tagline}>
                    Because every journey deserves a happy ending.
                </Text>
            </Animated.View>

            <View style={styles.loaderContainer}>
                <View style={styles.loader} />
            </View>
        </View>
    );
};
