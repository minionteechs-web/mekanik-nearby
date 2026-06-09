import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, ShieldAlert, ClipboardList, User, Wrench } from 'lucide-react-native';
import { COLORS, SPACING, SHADOW } from '../constants/theme';

export const BottomTabBar = ({ navigation, current, user }) => {
    const isMechanic = user?.role === 'mechanic';

    const driverTabs = [
        { name: 'Home', icon: Home, label: 'Home' },
        { name: 'Mechanics', icon: Search, label: 'Find' },
        { name: 'SOS', icon: ShieldAlert, fab: true },
        { name: 'Activity', icon: ClipboardList, label: 'Activity' },
        { name: 'Profile', icon: User, label: 'Profile' },
    ];

    const mechanicTabs = [
        { name: 'MechanicHome', icon: Wrench, label: 'Jobs' },
        { name: 'Profile', icon: User, label: 'Profile' },
    ];

    const tabs = isMechanic ? mechanicTabs : driverTabs;

    return (
        <View style={styles.bar}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = current === tab.name;

                if (tab.fab) {
                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={styles.fab}
                            onPress={() => navigation.navigate(tab.name)}
                            activeOpacity={0.85}
                        >
                            <Icon size={26} color="#fff" />
                        </TouchableOpacity>
                    );
                }

                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={styles.tab}
                        onPress={() => navigation.navigate(tab.name)}
                    >
                        <Icon size={22} color={active ? COLORS.brand : COLORS.textMuted} />
                        <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(18, 18, 18, 0.97)',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: SPACING.lg,
        paddingTop: SPACING.sm,
    },
    tab: {
        alignItems: 'center',
        gap: 2,
        minWidth: 52,
        paddingVertical: SPACING.xs,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    labelActive: {
        color: COLORS.brand,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.emergency,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -20,
        borderWidth: 4,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        ...SHADOW.fab,
    },
});
