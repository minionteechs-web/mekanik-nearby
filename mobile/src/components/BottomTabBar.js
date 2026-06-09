import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, Search, ShieldAlert, ClipboardList, Wrench } from 'lucide-react-native';
import { SPACING, SHADOW } from '../constants/theme';
import { ProfileAvatar } from './ProfileAvatar';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../utils/themeContext';

const createStyles = (colors) => ({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: colors.overlay,
        borderTopWidth: 1,
        borderTopColor: colors.border,
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
        color: colors.textMuted,
    },
    labelActive: {
        color: colors.brand,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.emergency,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -20,
        borderWidth: 4,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        ...SHADOW.fab,
    },
});

export const BottomTabBar = ({ navigation, current, user }) => {
    const styles = useThemedStyles(createStyles);
    const { colors } = useTheme();
    const isMechanic = user?.role === 'mechanic';

    const driverTabs = [
        { name: 'Home', icon: Home, label: 'Home' },
        { name: 'Mechanics', icon: Search, label: 'Find' },
        { name: 'SOS', icon: ShieldAlert, fab: true },
        { name: 'Activity', icon: ClipboardList, label: 'Activity' },
        { name: 'Profile', label: 'Profile', isProfile: true },
    ];

    const mechanicTabs = [
        { name: 'MechanicHome', icon: Wrench, label: 'Jobs' },
        { name: 'Profile', label: 'Profile', isProfile: true },
    ];

    const tabs = isMechanic ? mechanicTabs : driverTabs;

    return (
        <View style={styles.bar}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = current === tab.name;

                if (tab.isProfile) {
                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={styles.tab}
                            onPress={() => navigation.navigate(tab.name)}
                        >
                            <ProfileAvatar name={user?.username || 'User'} size={28} active={active} />
                            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
                        </TouchableOpacity>
                    );
                }

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
                        <Icon size={22} color={active ? colors.brand : colors.textMuted} />
                        <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
