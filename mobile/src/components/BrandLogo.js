import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../utils/themeContext';

const logoSource = require('../../assets/logo.png');

export const BrandLogo = ({ size = 72, showWordmark = true, compact = false, style }) => {
    const { colors, isDark } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    alignItems: 'center',
                    gap: compact ? 8 : 10,
                    flexDirection: compact ? 'row' : 'column',
                },
                mark: {
                    width: size,
                    height: size,
                    resizeMode: 'contain',
                },
                title: {
                    fontSize: size * 0.34,
                    fontWeight: '800',
                    color: colors.textMain,
                    letterSpacing: -0.5,
                },
                sub: {
                    fontSize: size * 0.16,
                    fontWeight: '700',
                    color: colors.brand,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                },
                textWrap: {
                    alignItems: compact ? 'flex-start' : 'center',
                },
                shadow: isDark
                    ? { shadowColor: '#E53935', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }
                    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
            }),
        [colors, compact, isDark, size]
    );

    return (
        <View style={[styles.root, style]}>
            <Image source={logoSource} style={[styles.mark, styles.shadow]} />
            {showWordmark && (
                <View style={styles.textWrap}>
                    <Text style={styles.title}>Mekanik</Text>
                    <Text style={styles.sub}>Nearby</Text>
                </View>
            )}
        </View>
    );
};
