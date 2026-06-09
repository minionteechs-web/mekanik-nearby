import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../utils/themeContext';
import { RADIUS, SPACING } from '../constants/theme';

const OPTIONS = [
    { id: 'auto', label: 'Auto', Icon: Monitor },
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
];

export const ThemeToggle = () => {
    const { mode, setMode, colors } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    flexDirection: 'row',
                    gap: 4,
                    padding: 4,
                    backgroundColor: colors.bgElevated,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                btn: {
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    paddingVertical: SPACING.sm,
                    borderRadius: RADIUS.sm,
                },
                btnActive: {
                    backgroundColor: colors.bgCard,
                },
                label: {
                    fontSize: 10,
                    fontWeight: '700',
                    color: colors.textMuted,
                },
                labelActive: {
                    color: colors.brand,
                },
            }),
        [colors]
    );

    return (
        <View style={styles.wrap} accessibilityRole="radiogroup">
            {OPTIONS.map(({ id, label, Icon }) => {
                const active = mode === id;
                return (
                    <TouchableOpacity
                        key={id}
                        style={[styles.btn, active && styles.btnActive]}
                        onPress={() => setMode(id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                    >
                        <Icon size={16} color={active ? colors.brand : colors.textMuted} />
                        <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
